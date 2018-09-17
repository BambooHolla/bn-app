import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AppFetchProvider } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject } from "rxjs";
import { AppSettingProvider, AppUrl } from "../app-setting/app-setting";
import { BlockModel, BlockResModel } from "../block-service/block.types";
import { UserInfoProvider } from "../user-info/user-info";
import { LoginServiceProvider } from "../login-service/login-service";
type BlockServiceProvider = import("../block-service/block-service").BlockServiceProvider;
import { MinServiceProvider } from "../min-service/min-service";
import {
  ParallelPool,
  PromiseType,
  PromiseOut,
} from "../../bnqkl-framework/PromiseExtends";
import { FLP_Tool } from "../../bnqkl-framework/FLP_Tool";
import {
  getQueryVariable,
  baseConfig,
  getSocketIOInstance,
} from "../../bnqkl-framework/helper";
import { sleep } from "../../bnqkl-framework/PromiseExtends";
import { CommonService } from "../commonService";
import { Mdb } from "../mdb";
import * as TYPE from "./peer.types";
export * from "./peer.types";
const PEERS: TYPE.LocalPeerModel[] = (() => {
  try {
    const PEERS_JSON = getQueryVariable("PEERS");
    if (PEERS_JSON) {
      return JSON.parse(PEERS_JSON);
    }
  } catch (err) {}
})() || [
  {
    origin: "http://publish.ifmchain.org",
    level: TYPE.PEER_LEVEL.TRUST,
    webChannelLinkNum: 0,
    netVersion: "mainnet",
    netInterval: 128,
    ip: "publish.ifmchain.org",
    height: 0,
    p2pPort: 9000,
    magic: "",
    webPort: 9002,
    delay: -1,
    acc_use_duration: 0,
    latest_verify_fail_time: 0,
    acc_verify_total_times: 0,
    acc_verify_success_times: 0,
  } as TYPE.LocalPeerModel,
];

@Injectable()
export class PeerServiceProvider extends CommonService {
  peerDb = new Mdb<TYPE.LocalPeerModel>("peers");
  static DEFAULT_TIMEOUT = 2000;
  ifmJs = AppSettingProvider.IFMJS;
  peerList = PEERS;
  constructor(
    public http: HttpClient,
    // public storage: Storage,
    public appSetting: AppSettingProvider,
    public fetch: AppFetchProvider,
    public minService: MinServiceProvider,
    public userInfo: UserInfoProvider,
    public loginService: LoginServiceProvider
  ) {
    super();
  }
  @FLP_Tool.FromGlobal blockService!: BlockServiceProvider;

  readonly PEER_SYNC = this.appSetting.APP_URL("/api/loader/status/sync");
  readonly PING_URL = this.appSetting.APP_URL("/api/blocks/getHeight");
  readonly PEERS_URL = this.appSetting.APP_URL("/api/peers/");
  readonly PEERS_QUERY_URL = this.appSetting.APP_URL("/api/peers/get");
  readonly FORGING_ENABLE = this.appSetting.APP_URL("/forging/enable");
  readonly SYSTEM_RUNTIME = this.appSetting.APP_URL(`/api/system/runtime`);
  readonly SYSTEM_BASE_INFO = this.appSetting.APP_URL(
    `/api/system/systemBaseInfo`
  );

  /*获取所有次信任节点*/
  async getAllSecondTrustPeers() {
    const trust_peer_list = this.peerList.filter(
      peer => peer.level === TYPE.PEER_LEVEL.TRUST
    );
    const col = new Map<string, TYPE.LocalPeerModel>();
    return (await Promise.all(
      trust_peer_list.map(trust_peer => this._searchPeers(trust_peer, col))
    )).reduce((res_list, peer_list) => res_list.concat(peer_list), []);
  }

  async getAllPeers() {
    const all_peers: TYPE.LocalPeerModel[] = [];
    for await (const peer of this.searchPeers(this.peerList)) {
      all_peers.push(peer);
    }
    return all_peers;
  }

  mathPeers(peers: TYPE.LocalPeerModel[]) {}

  /*搜索节点并返回节点检查信息*/
  async *searchAndCheckPeers(
    opts: {
      /*是否手动检测节点信息*/
      manual_check_peers?: boolean;
    } = {}
  ) {
    const checked_peer_infos: PromiseType<
      ReturnType<typeof PeerServiceProvider.prototype._checkPeer>
    >[] = [];
    const parallel_pool = new ParallelPool<typeof checked_peer_infos[0]>(4);
    /*是否开启检测节点信息*/
    let is_start_to_check = !opts.manual_check_peers;
    // 开始搜索节点
    for await (var _p of this.searchPeers(this.peerList)) {
      const peer = _p;
      if (!is_start_to_check) {
        is_start_to_check = yield peer;
      }
      parallel_pool.addTaskExecutor(() => this._checkPeer(peer));

      // console.log("peer", peer, is_start_to_check);
      if (is_start_to_check) {
        yield* parallel_pool.yieldResults({
          ignore_error: true,
          skip_when_no_full: true,
          yield_num: 1,
        });
      }
    }
    // console.log("all task add, yield infos", is_start_to_check);
    // 等待用户开启请求
    while (!is_start_to_check) {
      is_start_to_check = yield { search_done: true };
      if (is_start_to_check) {
        yield { check_start: true };
      }
    }

    yield* parallel_pool.yieldResults({ ignore_error: true });
  }
  private _getPeerWebsocketLinkNum(peer: TYPE.LocalPeerModel) {
    return this.minService
      .oneTimeUrl(this.minService.SYSTEM_WEBSOCKETLINKNUM, peer.origin, true)
      .getWebsocketLinkNum()
      .then(res => {
        peer.webChannelLinkNum = res;
        return res;
      })
      .catch(() => 0);
  }
  fetchPeerMagic(origin: string) {
    return this.fetch.get<{ magic: string; sourceIp: string }>(
      this.oneTimeUrl(this.SYSTEM_BASE_INFO, origin, true).SYSTEM_BASE_INFO
    );
  }
  private _getPeerMagic(peer: TYPE.LocalPeerModel) {
    return this.fetchPeerMagic(peer.origin)
      .then(system_base_info => {
        peer.magic = system_base_info.magic;
        localStorage.setItem("sourceIp", system_base_info.sourceIp);
        return peer.magic;
      })
      .catch(() => 0);
  }
  /*获取节点检查信息*/
  async _checkPeer(peer: TYPE.LocalPeerModel) {
    const tasks = [
      // 获取最后的六个区块
      this.blockService
        .oneTimeUrl(this.blockService.GET_BLOCK_BY_QUERY, peer.origin, true)
        .getBlocks({ orderBy: "height:desc", limit: 6 })
        .then(res => {
          peer.height = res.blocks[0].height;
          return res.blocks;
        }),
      // 获取最前的六个区块
      this.blockService
        .oneTimeUrl(this.blockService.GET_BLOCK_BY_QUERY, peer.origin, true)
        .getBlocks({ orderBy: "height:asc", limit: 6 })
        .then(res => res.blocks),
      this._getPeerWebsocketLinkNum(peer),
      this._getPeerMagic(peer),
    ];

    let highest_blocks: BlockModel[] = [];
    let lowest_blocks: BlockModel[] = [];
    let web_link_num: number = 0;
    try {
      const start_time = performance.now();
      await Promise.race(tasks as any);
      const end_time = performance.now();
      peer.delay = end_time - start_time;

      [highest_blocks, lowest_blocks, web_link_num] = await Promise.all<any>(
        tasks as any
      );
      delete peer.disabled;
    } catch (err) {
      peer.disabled = true;
    }

    console.log(peer, highest_blocks, lowest_blocks);
    return { peer, highest_blocks, lowest_blocks, web_link_num };
  }

  /**计算节点的magic信息*/
  async calcPeersMagic(peers: TYPE.LocalPeerModel[] = this.peerList) {
    // 先获取magic信息
    await Promise.all(
      peers.map(async peer => {
        // 如果获取失败了，就忽略这个入口节点
        const { magic } = await this.fetchPeerMagic(peer.origin).catch(() => ({
          magic: "",
        }));
        peer.magic = magic;
      })
    );
    // 无法正确访问接口的节点直接过滤掉
    peers = peers.filter(p => p.magic);
    // 统计magic的权重
    const origin_peer_map = new Map<string, TYPE.LocalPeerModel>();
    peers.forEach(p => origin_peer_map.set(p.origin, p));
    const magic_origin_map = new Map<string, Set<string>>();

    const trust_magic = peers.forEach(p => {
      let origin_set = magic_origin_map.get(p.magic);
      if (!origin_set) {
        magic_origin_map.set(p.magic, (origin_set = new Set()));
      }
      origin_set.add(p.origin);
    });

    const calced_magic_peers_list: {
      magic: string;
      peers: TYPE.LocalPeerModel[];
    }[] = [];
    for (var [magic, origin_set] of magic_origin_map.entries()) {
      calced_magic_peers_list.push({
        magic,
        peers: [...origin_set].map(
          origin => origin_peer_map.get(origin) as TYPE.LocalPeerModel
        ),
      });
    }
    return calced_magic_peers_list.sort(
      // 逆序排序
      (a, b) => b.peers.length - a.peers.length
    );
  }

  /**搜索节点*/
  async *searchPeers(
    enter_port_peers = this.peerList, // 初始的节点
    collection_peers = new Map<string, TYPE.LocalPeerModel>(), // 节点去重用的表
    parallel_pool = new ParallelPool<TYPE.LocalPeerModel[]>(4) // 1. 并行池，可以同时执行2个任务
  ): AsyncIterableIterator<TYPE.LocalPeerModel> {
    const self = this; // Generator function 无法与箭头函数混用，所以这里的this必须主动声明在外部。

    for (var _p of enter_port_peers) {
      const peer = _p;
      if (!collection_peers.has(peer.origin)) {
        collection_peers.set(peer.origin, peer);
        yield peer;
      }
    }
    /*递归搜索代码片段*/
    const recursiveSearch = async function*(skip_when_no_full?: boolean) {
      for await (var _ps of parallel_pool.yieldResults({
        ignore_error: true, // 忽略错误（忽略不可用的节点）
        skip_when_no_full, // 在池子不填满的情况下是否返回
      })) {
        const peers = _ps;
        for (var _p of peers) {
          const peer = _p;
          yield peer;
          // 递归搜索
          yield* self.searchPeers([peer], collection_peers, parallel_pool);
        }
      }
    };

    for (var _ep of enter_port_peers) {
      const enter_port_peer = _ep;
      // 向并行池中添加任务
      parallel_pool.addTaskExecutor(() =>
        this._searchPeers(enter_port_peer, collection_peers)
      );
      yield* recursiveSearch(true);
    }
    yield* recursiveSearch();
  }

  /**获取指定节点的子节点*/
  private async _searchPeers(
    enter_port_peer: typeof PeerServiceProvider.prototype.peerList[0],
    collection_peers: Map<string, TYPE.LocalPeerModel>
  ) {
    // 这个节点可能不工作，所以定一个3s超时的功能
    const { peers: sec_peers } = await this.fetch
      .timeout(3000)
      .get<{
        peers: TYPE.PeerModel[];
      }>(this.PEERS_URL.disposableServerUrl(enter_port_peer.origin), {
        search: { type: 0 /*只搜索web节点*/ },
      })
      .catch(err => ({ peers: [] as TYPE.PeerModel[] }));
    const next_level = TYPE.getNextPeerLevel(enter_port_peer.level);
    const res = [] as TYPE.LocalPeerModel[];
    sec_peers.forEach(sec_peer_info => {
      if (
        sec_peer_info.state === 1 &&
        !sec_peer_info.port.toString().endsWith("04")
      ) {
        const webPort = sec_peer_info.webPort || sec_peer_info.port + 2;
        const origin = "http://" + sec_peer_info.ip + ":" + webPort;
        if (collection_peers.has(origin)) {
          return;
        }
        const sec_peer: TYPE.LocalPeerModel = {
          webChannelLinkNum: 0,
          ip: sec_peer_info.ip,
          height: sec_peer_info.height,
          p2pPort: sec_peer_info.port,
          webPort,
          origin,
          level: next_level,
          delay: -1,
          acc_use_duration: 0,
          latest_verify_fail_time: 0,
          acc_verify_total_times: 0,
          acc_verify_success_times: 0,
          netVersion: sec_peer_info.netVersion,
          magic: sec_peer_info.magic,
          netInterval: sec_peer_info.netInterval,
          type: sec_peer_info.type,
        };
        collection_peers.set(origin, sec_peer);
        res.push(sec_peer);
      }
    });
    return res;
  }

  /**
   * 获取可用节点
   * 从未保存过时返回空数组
   */
  async getPeersLocal() {
    const peers = (await this.peerDb.find({})) as TYPE.LocalPeerModel[];
    return peers.length ? peers : PEERS;
  }

  /**
   * 设置委托人
   */
  setDelegateToMiningMachine(secret: string, publicKey?: string) {
    return this.fetch.post<{ address: string }>(this.FORGING_ENABLE, {
      secret,
      publicKey,
    });
  }

  static fetchPeerPortInfo(ip: string, port: number, timeout_ms = 2000) {
    const fetch_task = new PromiseOut<{ success: boolean; webPort: number }>();

    const xhr = new XMLHttpRequest();
    xhr.open(
      "GET",
      `http://${ip}:${port}/api/${AppUrl.BACKEND_VERSION}system/portInfo`
    );
    xhr.send();
    setTimeout(() => {
      xhr.abort();
      fetch_task.reject(new Error("TIME OUT"));
    }, timeout_ms);
    xhr.onreadystatechange = _ => {
      if (xhr.readyState === 4) {
        if (xhr.responseText) {
          try {
            fetch_task.resolve(JSON.parse(xhr.responseText));
          } catch (err) {
            fetch_task.reject(err);
          }
        } else {
          fetch_task.reject(new Error("RESPONSE ERROR"));
        }
      }
    };

    return fetch_task.promise;
  }

  /*计算一组节点的可靠性*/
  static calcPeers(
    peer_info_list: {
      peer: TYPE.LocalPeerModel;
      highest_blocks: BlockModel[];
      lowest_blocks: BlockModel[];
      web_link_num: number;
    }[],
    all_second_trust_peer_list: TYPE.LocalPeerModel[] = []
  ) {
    // const second_peer_num = Math.max(all_second_trust_peer_list.length, 4);
    const peer_info_level_map = new Map<
      TYPE.PEER_LEVEL,
      typeof peer_info_list
    >();
    peer_info_list.forEach(peer_info => {
      const list =
        peer_info_level_map.get(peer_info.peer.level) ||
        ([] as typeof peer_info_list);
      list.push(peer_info);
      peer_info_level_map.set(peer_info.peer.level, list);
    });
    /*一组节点与他的可用性*/
    const res_list: ({
      rate: number;
      score: number;
      level: TYPE.PEER_LEVEL;
      peer_info_list: typeof peer_info_list;
    })[] = [];
    let total_rate_base = 0;
    peer_info_level_map.forEach((peer_info_list, level) => {
      const res = PeerServiceProvider._calcLeveledPeerInfoList(
        peer_info_list,
        level,
        all_second_trust_peer_list
      );
      if (res) {
        let score = 0;
        if (level === TYPE.PEER_LEVEL.TRUST) {
          score = 50;
        }
        if (level === TYPE.PEER_LEVEL.SEC_TRUST) {
          score = 20 + (Math.log(peer_info_list.length) - Math.log(4)) * 10;
        }
        if (level === TYPE.PEER_LEVEL.OTHER) {
          score = (Math.log(peer_info_list.length) - Math.log(57)) * 2;
        }
        if (score > 0) {
          total_rate_base += score;
          res_list.push({
            score,
            rate: 0,
            level,
            peer_info_list: res,
          });
        }
      }
    });
    res_list.map(item => {
      item.rate = item.score / total_rate_base;
    });
    return res_list;
    // if(res_list.length)
  }
  private static _calcLeveledPeerInfoList(
    peer_info_list: {
      peer: TYPE.LocalPeerModel;
      highest_blocks: BlockModel[];
      lowest_blocks: BlockModel[];
      web_link_num: number;
    }[],
    level: TYPE.PEER_LEVEL,
    all_second_trust_peer_list: TYPE.LocalPeerModel[] = []
  ) {
    const second_peer_num = Math.max(all_second_trust_peer_list.length, 4);
    /**拜占庭算法中至少需要的数量*/
    const min_second_peer_num = Math.floor(second_peer_num / 2) + 1;
    let peer_info_list_filtered_list: (typeof peer_info_list) | undefined;
    if (level === TYPE.PEER_LEVEL.TRUST) {
      // 绝对信任的节点直接不校验了
      return peer_info_list;
    }
    // 先拜占庭第一个区块是一样的
    const peer_first_block_map = new Map<string, typeof peer_info_list>();
    peer_info_list.forEach(peer_info => {
      const first_block = peer_info.lowest_blocks[0];
      if (first_block) {
        const peer_list =
          peer_first_block_map.get(first_block.id) ||
          ([] as typeof peer_info_list);
        peer_list.push(peer_info);
        peer_first_block_map.set(first_block.id, peer_list);
      }
    });
    for (var f_peer_info_list of [...peer_first_block_map.values()].sort(
      (a, b) => b.length - a.length
    )) {
      // if (level === TYPE.PEER_LEVEL.SEC_TRUST && f_peer_info_list.length >= 4) {
      // 拜占庭最后的几个区块
      const peer_last_block_map = new Map<string, typeof f_peer_info_list>();
      f_peer_info_list.forEach(peer_info => {
        peer_info.highest_blocks.forEach(high_block => {
          const peer_list =
            peer_last_block_map.get(high_block.id) ||
            ([] as typeof f_peer_info_list);
          peer_list.push(peer_info);
          peer_last_block_map.set(high_block.id, peer_list);
        });
      });
      for (var h_peer_info_list of [...peer_last_block_map.values()].sort(
        (a, b) => b.length - a.length
      )) {
        return h_peer_info_list;
        /// PS: 暂时停止拜占庭，直接使用最高的
        /* if (
          level === TYPE.PEER_LEVEL.SEC_TRUST &&
          h_peer_info_list.length >= min_second_peer_num
        ) {
          return h_peer_info_list;
        }
        if (level === TYPE.PEER_LEVEL.OTHER && h_peer_info_list.length >= 57) {
          return h_peer_info_list;
        } */
      }
      // }
    }
  }
  // /**保存或者读取校验完成的可用节点*/
  // useablePeers(useable_peers?: TYPE.LocalPeerModel[]) {
  //   if (useable_peers) {
  //     sessionStorage.setItem("USEABLE_PEERS", JSON.stringify(useable_peers));
  //     return useable_peers;
  //   } else {
  //     try {
  //       const useable_peers_json = sessionStorage.getItem("USEABLE_PEERS");
  //       if (useable_peers_json) {
  //         return JSON.parse(useable_peers_json) as TYPE.LocalPeerModel[];
  //       }
  //     } catch (err) {}
  //     return [];
  //   }
  // }
  /**获取操作系统对应的图标*/
  getSystemTypeIcon(platfrom: string) {
    if (platfrom === "linux") {
      return "ifm-linux";
    }
    if (platfrom === "darwin") {
      return "ifm-mac";
    }
    if (platfrom === "win32") {
      return "ifm-windows";
    }
    return "ifm-unknown-system";
  }
  async *updateUseablePeersInfo(useablePeers: TYPE.LocalPeerModel[], emiter?) {
    const fetch_peer_infos: PromiseType<
      ReturnType<typeof PeerServiceProvider.prototype.fetchPeersInfoAndUpdate>
    >[] = [];
    const parallel_pool = new ParallelPool<typeof fetch_peer_infos[0]>(4);
    for (var i = 0; i < useablePeers.length; i += 1) {
      const peer = useablePeers[i];
      parallel_pool.addTaskExecutor(() =>
        this.fetchPeersInfoAndUpdate(peer, emiter)
      );
    }

    yield* parallel_pool.yieldResults({ ignore_error: true });
  }
  private async fetchPeersInfoAndUpdate(
    peer: TYPE.LocalPeerModel,
    emiter?: { emit: any }
  ) {
    let finished_task_num = 0;
    const emit_progress = emiter
      ? (v = finished_task_num) => {
          finished_task_num = v;
          emiter.emit("fetch-peers-info", {
            peer,
            total_tasks_num: tasks.length,
            finished_num: finished_task_num,
          });
        }
      : () => {};
    const common_cache_handler = () => {
      peer.disabled = true;
    };
    const get_platform_task = this.fetch
      .get<any>(
        this.oneTimeUrl(this.SYSTEM_RUNTIME, peer.origin, true).SYSTEM_RUNTIME
      )
      .then(runtime => {
        peer.platform = runtime.data.System.platform;
        emit_progress(finished_task_num + 1);
        return runtime;
      });
    const get_linknum_task = this._getPeerWebsocketLinkNum(peer).then(res => {
      emit_progress(finished_task_num + 1);
      return res;
    });
    const get_lastblock_task = this.blockService
      .oneTimeUrl(this.blockService.GET_LAST_BLOCK_URL, peer.origin, true)
      .getLastBlock()
      .then(lastBlock => {
        peer.height = lastBlock.height;
        emit_progress(finished_task_num + 1);
        return lastBlock;
      });
    const get_system_base_info = this._getPeerMagic(peer).then(res => {
      emit_progress(finished_task_num + 1);
      return res;
    });
    const tasks = [
      get_platform_task,
      get_linknum_task,
      get_lastblock_task,
      get_system_base_info,
    ];
    emit_progress(0);

    let runtime;
    let web_link_num;
    try {
      const start_time = performance.now();
      await Promise.race(tasks as any);
      peer.delay = performance.now() - start_time;

      [runtime, web_link_num] = await Promise.all(tasks as any);
      delete peer.disabled;
    } catch (err) {
      peer.disabled = true;
    }

    const cur_peer_data = await this.peerDb.findOne({ origin: peer.origin });
    if (cur_peer_data) {
      cur_peer_data.disabled = peer.disabled;
      cur_peer_data.delay = peer.delay;
      cur_peer_data.height = peer.height;
      cur_peer_data.platform = peer.platform;
      cur_peer_data.magic = peer.magic;
      cur_peer_data.webChannelLinkNum = peer.webChannelLinkNum;
      Object.assign(peer, cur_peer_data);
      await this.peerDb.update({ _id: peer["_id"] }, peer);
    }

    return { peer, runtime, web_link_num } as {
      peer: typeof peer;
      runtime: any;
      web_link_num: number;
    };
  }

  private _update_peer_flow_lock = new Map<
    string,
    { acc_flow: number; lock: Promise<void> }
  >();
  async updatePeerFlow(origin: string, flow: number) {
    let lock_info = this._update_peer_flow_lock.get(origin);
    if (!lock_info) {
      const interval_task = sleep(1000); //每一秒只能操作一次，不然数据库压力太大
      const li = {
        acc_flow: 0,
        lock: this._updatePeerFlow(origin, flow)
          .then(() => interval_task)
          .then(() => {
            // 解锁并合并更新
            this._update_peer_flow_lock.delete(origin);
            if (li.acc_flow) {
              this.updatePeerFlow(origin, li.acc_flow);
            }
          }),
      };
      lock_info = li;
    } else {
      lock_info.acc_flow += flow;
    }
  }

  private async _updatePeerFlow(origin: string, flow: number) {
    const peer = await this.peerDb.findOne({ origin });
    if (!peer) {
      // console.error(new Error(`找不到本地节点信息: ${origin}`));
      return;
    }
    peer.acc_flow = (peer.acc_flow || 0) + flow;
    await this.peerDb.update({ _id: peer["_id"] }, peer);
  }

  /**更新节点使用时间*/
  async updatePeerDuration(origin: string, acc_duration: number) {
    const peer = await this.peerDb.findOne({ origin });
    if (!peer) {
      // console.error(new Error(`找不到本地节点信息: ${origin}`));
      return;
    }
    peer.acc_use_duration += acc_duration;
    await this.peerDb.update({ _id: peer["_id"] }, peer);
  }

  /**检测本地magic是否正确*/
  async checkCurrentMagic() {
    const local_magic = localStorage.getItem("MAGIC");
    if (!local_magic) {
      return false;
    }
    if (await this.fetch.webio.getOnlineStatus()) {
      return this.fetch
        .get<any>(this.SYSTEM_BASE_INFO)
        .then(info => info.magic === local_magic);
    } else {
      // 没网络的情况下，直接默认成功
      return true;
    }
  }

  /**
   * 连接指定节点
   */
  async linkPeer(peer: TYPE.LocalPeerModel) {
    // await sleep(500);
    localStorage.setItem("SERVER_URL", peer.origin);
    localStorage.setItem("MAGIC", peer.magic);
    const BLOCK_UNIT_TIME = peer.netInterval * 1000 || 128000;
    localStorage.setItem("BLOCK_UNIT_TIME", `${BLOCK_UNIT_TIME}`);
    localStorage.setItem("NET_VERSION", peer.netVersion || "mainnet");
    sessionStorage.setItem("LINK_PEER", "true");
    // this.peerService.useablePeers(this.useable_peers);

    // 保存这次检测完成的时间，为了避免过度频繁的检测
    localStorage.setItem("LINK_PEER", Date.now().toString());
    // location.hash = "";
    // location.reload();

    if (
      baseConfig.NET_VERSION !== peer.magic ||
      baseConfig.NET_VERSION !== peer.netVersion ||
      AppSettingProvider.BLOCK_UNIT_TIME != baseConfig.BLOCK_UNIT_TIME
    ) {
      location.hash = "";
      location.reload();
      return;
    }
    // 只支持url动态重载
    if (baseConfig.SERVER_URL !== peer.origin) {
      baseConfig.SERVER_URL = peer.origin;
      AppSettingProvider.SERVER_URL = baseConfig.SERVER_URL;
      // 重新初始化io
      this.blockService.io.disconnect();
      delete this.blockService["_io"];
      this.blockService.bindIOBlockChange();
      FLP_Tool.webio = getSocketIOInstance(baseConfig.SERVER_URL, "/web");
      this.fetch.webio = getSocketIOInstance(baseConfig.SERVER_URL, "/web");
      /// TODO: 重新登录
      if (this.userInfo.password) {
        await this.loginService.doLogin(this.userInfo.password, true);
      }
    }
  }
}
