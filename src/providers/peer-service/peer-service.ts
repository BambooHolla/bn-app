import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AppFetchProvider } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject } from "rxjs";
import { AppSettingProvider, AppUrl } from "../app-setting/app-setting";
import {
  BlockServiceProvider,
  BlockModel,
} from "../block-service/block-service";
import {
  ParallelPool,
  PromiseType,
  PromiseOut,
} from "../../bnqkl-framework/PromiseExtends";
import { getQueryVariable } from "../../bnqkl-framework/helper";
import * as IFM from "ifmchain-ibt";
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
  // {
  //   origin: "http://localhost:19002",
  //   level: TYPE.PEER_LEVEL.TRUST,
  //   web_channel_link_num: 0,
  //   ip: "localhost",
  //   height: 0,
  //   p2pPort: 19000,
  //   webPort: 19002,
  //   delay: -1,
  //   acc_use_duration: 0,
  //   latest_verify_fail_time: 0,
  //   acc_verify_total_times: 0,
  //   acc_verify_success_times: 0,
  // },
  {
    origin: "http://mainnet.ifmchain.org",
    level: TYPE.PEER_LEVEL.TRUST,
    web_channel_link_num: 0,
    ip: "mainnet.ifmchain.org",
    height: 0,
    p2pPort: 9000,
    webPort: 9002,
    delay: -1,
    acc_use_duration: 0,
    latest_verify_fail_time: 0,
    acc_verify_total_times: 0,
    acc_verify_success_times: 0,
  },

  // {
  //   origin: "http://mainnet.ifmchain.org",
  //   level: TYPE.PEER_LEVEL.TRUST,
  //   web_channel_link_num: 0,
  //   ip: "mainnet.ifmchain.org",
  //   height: 0,
  //   p2pPort: -1,
  //   webPort: 80,
  //   delay: -1,
  //   acc_use_duration: 0,
  //   latest_verify_fail_time: 0,
  //   acc_verify_total_times: 0,
  //   acc_verify_success_times: 0,
  // },
  // ...["35.194.161.10", "35.194.129.80", "35.194.234.159", "35.185.142.124"].map(
  //   ip => {
  //     return {
  //       origin: `http://${ip}:19002`,
  //       level: TYPE.PEER_LEVEL.SEC_TRUST,
  //       web_channel_link_num: 0,
  //       ip,
  //       height: 0,
  //       p2pPort: 19000,
  //       webPort: 19002,
  //       delay: -1,
  //       acc_use_duration: 0,
  //       latest_verify_fail_time: 0,
  //       acc_verify_total_times: 0,
  //       acc_verify_success_times: 0,
  //     };
  //   },
  // ),
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
    public blockService: BlockServiceProvider,
  ) {
    super();
  }

  readonly PEER_SYNC = this.appSetting.APP_URL("/api/loader/status/sync");
  readonly PING_URL = this.appSetting.APP_URL("/api/blocks/getHeight");
  readonly PEERS_URL = this.appSetting.APP_URL("/api/peers/");
  readonly PEERS_QUERY_URL = this.appSetting.APP_URL("/api/peers/get");
  readonly FORGING_ENABLE = this.appSetting.APP_URL("/forging/enable");

  /*获取所有次信任节点*/
  async getAllSecondTrustPeers() {
    const trust_peer_list = this.peerList.filter(
      peer => peer.level === TYPE.PEER_LEVEL.TRUST,
    );
    const col = new Map<string, TYPE.LocalPeerModel>();
    return (await Promise.all(
      trust_peer_list.map(trust_peer => this._searchPeers(trust_peer, col)),
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
    } = {},
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
  /*获取节点检查信息*/
  private async _checkPeer(peer: TYPE.LocalPeerModel) {
    const start_time = performance.now();
    // 获取最后的六个区块
    const [highest_blocks, lowest_blocks] = await Promise.all([
      this.blockService
        .oneTimeUrl(this.blockService.GET_BLOCK_BY_QUERY, peer.origin, true)
        .getBlocks({ orderBy: "height:desc", limit: 6 })
        .then(res => res.blocks),
      this.blockService
        .oneTimeUrl(this.blockService.GET_BLOCK_BY_QUERY, peer.origin, true)
        .getBlocks({ orderBy: "height:asc", limit: 6 })
        .then(res => res.blocks),
    ]);

    const end_time = performance.now();
    console.log(peer, highest_blocks, lowest_blocks);
    peer.delay = end_time - start_time;
    return { peer, highest_blocks, lowest_blocks };
  }

  /*搜索节点*/
  async *searchPeers(
    enter_port_peers = this.peerList, // 初始的节点
    collection_peers = new Map<string, TYPE.LocalPeerModel>(), // 节点去重用的表
    parallel_pool = new ParallelPool<TYPE.LocalPeerModel[]>(4), // 1. 并行池，可以同时执行2个任务
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
        this._searchPeers(enter_port_peer, collection_peers),
      );
      yield* recursiveSearch(true);
    }
    yield* recursiveSearch();
  }

  /*获取指定节点的子节点*/
  private async _searchPeers(
    enter_port_peer: typeof PeerServiceProvider.prototype.peerList[0],
    collection_peers: Map<string, TYPE.LocalPeerModel>,
  ) {
    const { peers: sec_peers } = await this.fetch
      .get<{
        peers: TYPE.PeerModel[];
      }>(this.PEERS_URL.disposableServerUrl(enter_port_peer.origin))
      .catch(err => ({ peers: [] as TYPE.PeerModel[] }));
    const next_level = TYPE.getNextPeerLevel(enter_port_peer.level);
    const res = [] as TYPE.LocalPeerModel[];
    sec_peers.forEach(sec_peer_info => {
      if (
        sec_peer_info.state === 1 &&
        !sec_peer_info.port.toString().endsWith("04")
      ) {
        const webPort = sec_peer_info["webPort"] || sec_peer_info.port + 2;
        const origin = "http://" + sec_peer_info.ip + ":" + webPort;
        if (collection_peers.has(origin)) {
          return;
        }
        const sec_peer: TYPE.LocalPeerModel = {
          web_channel_link_num: 0,
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
    const peers = (await this.peerDb.find(
      {},
      { sort: { node_quality: -1 } },
    )) as TYPE.LocalPeerModel[];
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
      `http://${ip}:${port}/api/${AppUrl.BACKEND_VERSION}system/portInfo`,
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
    }[],
    all_second_trust_peer_list: TYPE.LocalPeerModel[] = [],
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
        all_second_trust_peer_list,
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
    }[],
    level: TYPE.PEER_LEVEL,
    all_second_trust_peer_list: TYPE.LocalPeerModel[] = [],
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
      (a, b) => b.length - a.length,
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
        (a, b) => b.length - a.length,
      )) {
        if (
          level === TYPE.PEER_LEVEL.SEC_TRUST &&
          h_peer_info_list.length >= min_second_peer_num
        ) {
          return h_peer_info_list;
        }
        if (level === TYPE.PEER_LEVEL.OTHER && h_peer_info_list.length >= 57) {
          return h_peer_info_list;
        }
      }
      // }
    }
  }
}
