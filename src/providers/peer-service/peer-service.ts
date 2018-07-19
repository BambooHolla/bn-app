import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AppFetchProvider } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject } from "rxjs";
import { AppSettingProvider, AppUrl } from "../app-setting/app-setting";
import { BlockServiceProvider } from "../block-service/block-service";
import {
  ParallelPool,
  PromiseType,
  PromiseOut,
} from "../../bnqkl-framework/PromiseExtends";
import * as IFM from "ifmchain-ibt";
import { CommonService } from "../commonService";
import { Mdb } from "../mdb";
import * as TYPE from "./peer.types";
export * from "./peer.types";
const PEERS = [
  // { origin: "http://mainnet.ifmchain.org", level: TYPE.PEER_LEVEL.TRUST },
  { origin: "http://35.194.161.10:19002", level: TYPE.PEER_LEVEL.SEC_TRUST },
  { origin: "http://35.194.129.80:19002", level: TYPE.PEER_LEVEL.SEC_TRUST },
  { origin: "http://35.194.234.159:19002", level: TYPE.PEER_LEVEL.SEC_TRUST },
  { origin: "http://35.185.142.124:19002", level: TYPE.PEER_LEVEL.SEC_TRUST },
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

  async getAllPeers() {
    const all_peers: TYPE.LocalPeerModel[] = [];
    for await (const peer of this.searchPeers(this.peerList)) {
      all_peers.push(peer);
    }
    return all_peers;
  }

  mathPeers(peers: TYPE.LocalPeerModel[]) {}

  /*搜索节点并返回节点检查信息*/
  async *searchAndCheckPeers(opts: { manual_check_peers?: boolean } = {}) {
    const checked_peer_infos: PromiseType<
      ReturnType<typeof PeerServiceProvider.prototype._checkPeer>
    >[] = [];
    const parallel_pool = new ParallelPool<typeof checked_peer_infos[0]>(2);

    let is_start_to_check = !opts.manual_check_peers;
    // 开始搜索节点
    for await (var _p of this.searchPeers(this.peerList)) {
      const peer = _p;
      if (!is_start_to_check) {
        is_start_to_check = yield peer;
      }
      parallel_pool.addTaskExecutor(() => this._checkPeer(peer));

      console.log("peer", peer);
      if (is_start_to_check) {
        yield* parallel_pool.yieldResults({
          ignore_error: true,
          skip_when_no_full: true,
          yield_num: 1,
        });
      }
    }
    console.log("all task add, yield infos");
    // 等待用户开启请求
    while (!is_start_to_check) {
      is_start_to_check = yield { search_done: true };
    }

    yield* parallel_pool.yieldResults({ ignore_error: true });
  }
  /*获取节点检查信息*/
  private async _checkPeer(peer: TYPE.LocalPeerModel) {
    const start_time = performance.now();
    // 获取最后的六个区块
    const [highest_blocks, lowest_blocks] = await Promise.all([
      this.blockService
        .oneTimeUrl(this.blockService.GET_BLOCK_BY_QUERY, peer.origin)
        .getBlocks({ orderBy: "height:desc", limit: 6 }),
      this.blockService
        .oneTimeUrl(this.blockService.GET_BLOCK_BY_QUERY, peer.origin)
        .getBlocks({ orderBy: "height:asc", limit: 6 }),
    ]);

    const end_time = performance.now();
    peer.delay = end_time - start_time;
    return { peer, highest_blocks, lowest_blocks };
  }

  /*搜索节点*/
  async *searchPeers(
    enter_port_peers = this.peerList, // 初始的节点
    collection_peers = new Map<string, TYPE.LocalPeerModel>(), // 节点去重用的表
    parallel_pool = new ParallelPool<TYPE.LocalPeerModel[]>(2), // 1. 并行池，可以同时执行2个任务
  ): AsyncIterableIterator<TYPE.LocalPeerModel> {
    const self = this; // Generator function 无法与箭头函数混用，所以这里的this必须主动声明在外部。
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
    const { peers: sec_peers } = await this.fetch.get<{
      peers: TYPE.PeerModel[];
    }>(this.PEERS_URL.disposableServerUrl(enter_port_peer.origin));
    const next_level = TYPE.getNextPeerLevel(enter_port_peer.level);
    const res = [] as TYPE.LocalPeerModel[];
    sec_peers.forEach(sec_peer_info => {
      if (sec_peer_info.state === 1) {
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
          create_time: Date.now(),
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
}
