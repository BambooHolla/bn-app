import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AppFetchProvider } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject } from "rxjs";
import { AppSettingProvider, AppUrl } from "../app-setting/app-setting";
import { BlockServiceProvider } from "../block-service/block-service";
import * as IFM from "ifmchain-ibt";
import { CommonService } from "../commonService";
import { Mdb } from "../mdb";
import * as TYPE from "./peer.types";
export * from "./peer.types";
const PEERS = [
  { host: "http://mainnet.ifmchain.org", level: TYPE.PEER_LEVEL.TRUST },
];

@Injectable()
export class PeerServiceProvider extends CommonService {
  peerDb = new Mdb<TYPE.LocalPeerModel>("peers");
  static DEFAULT_TIMEOUT = 2000;
  ifmJs: any;
  peer: any;
  peerList?: any[] = [];
  constructor(
    public http: HttpClient,
    // public storage: Storage,
    public appSetting: AppSettingProvider,
    public fetch: AppFetchProvider,
    public blockService: BlockServiceProvider,
  ) {
    super();
    this.ifmJs = AppSettingProvider.IFMJS;
    this.peer = this.ifmJs.Api(AppSettingProvider.HTTP_PROVIDER).peer;
    // this.peerList = [
    //   "http://mainnet.ifmchain.org",
    //   "http://test1.ifmchain.org",
    // ];
  }

  readonly PEER_SYNC = this.appSetting.APP_URL("/api/loader/status/sync");
  readonly PING_URL = this.appSetting.APP_URL("/api/blocks/getHeight");
  readonly PEERS_URL = this.appSetting.APP_URL("/api/peers/");
  readonly PEERS_QUERY_URL = this.appSetting.APP_URL("/api/peers/get");
  readonly FORGING_ENABLE = this.appSetting.APP_URL("/forging/enable");

  /**
   * 获取节点高度最高的可用节点排序
   * step1 - 根据本地节点获取节点列表，读取本地的
   * step2 - 按照高度进行排序，节点状态不好的进行排除
   * step3 - ping所有节点获得从上至下的所有毫秒
   * step4 - 搜索中，超时的节点进行排除，块高度不一致的进行排除
   * step5 - 一定时间内选择高度最高的最快的节点，当不存在时选择高度第二高的最快的
   * step6 - 保存节点列表至本地，节点列表首先选择已筛选的，没有再选择配置文件中的
   */
  async sortPeers(onChange?: Function) {
    let peers = await this.getAllPeers();
    const peersArray: TYPE.LocalPeerModel[] = [];
    function sortPeers() {
      peersArray.sort((a, b) => {
        if (a.state !== b.state) {
          return b.state - a.state; //state 从2排到1
        }
        if (a.height !== b.height) {
          return b.height - a.height; // 高度从高到低
        }
        return a.delay - b.delay; //延迟从低到高
      });
    }

    //获取保存的节点列表中的每一个节点的连接时间和高度
    await Promise.all(
      peers.map(async peer => {
        const startTimestamp = new Date().getTime();
        try {
          this.emit("peer-ping-start", peer);
          const data = await this.fetch
            .timeout(PeerServiceProvider.DEFAULT_TIMEOUT)
            .get<{ height: number }>(peer.origin + this.PING_URL.path);
          const endTimestamp = new Date().getTime();
          peer.delay = endTimestamp - startTimestamp;
          peer.height = data.height;

          peersArray.push(peer);
          this.emit("peer-ping-success", peer);
          this.emit("peer-ping-success:" + peer, peer);
          if (onChange) {
            sortPeers();
            onChange(peersArray);
          }
        } catch (err) {
          console.warn("PING PEER ERROR:", err);
          this.emit("peer-ping-error", err, peer);
          this.emit("peer-ping-error:" + peer, err);
        }
      }),
    );

    //对列表进行排序，根据高度进行排序，再根据速度进行筛选
    sortPeers();

    await this.peerDb.insertMany(peers);

    return peersArray;
  }

  /**
   * 获取所有节点（未进行统计排序）
   * 其中可用节点才被加入
   * 状态为2（未发生过错误）的节点置于头部
   * deep为搜索的深度，默认只搜索一次
   */
  async getAllPeers(deep = 1) {
    const peers = await this.getPeersLocal();
    //当不存在本地已保存的节点IP时
    //根据配置文件获取节点，再获取每一个节点的所有节点列表

    const peer_list = await Promise.all(
      peers.map(async peer_info => {
        const next_level = TYPE.getNextPeerLevel(peer_info.level);
        const { peers: sec_peers } = await this.fetch.get<{
          peers: TYPE.PeerModel[];
        }>(peer_info.origin + this.PEERS_URL.path);
        return sec_peers.map(sec_peer_info => {
          const sec_peer: TYPE.LocalPeerModel = {
            ...sec_peer_info,
            origin: "http://" + sec_peer_info.ip + ":" + sec_peer_info.port,
            level: next_level,
            delay: -1,
            acc_use_duration: 0,
            latest_verify_fail_time: 0,
            acc_verify_total_times: 0,
            acc_verify_success_times: 0,
            create_time: Date.now(),
          };
          return sec_peer;
        });
      }),
    );
    return peer_list.reduce((res, peers) => res.concat(peers), []);
  }

  /**
   * 根据节点数组进行遍历搜索
   * @param peerList
   */
  async getAllPeersFromPeerList(peerList) {
    const all_peers: string[] = [];
    await Promise.all(
      peerList.map(async peer_host_info => {
        let peer_host = "";
        let data: any;
        if ("ip" in peer_host_info) {
          peer_host =
            "http://" +
            peer_host_info.ip +
            (peer_host_info.port ? ":" + peer_host_info.port : "");
        } else if (typeof peer_host_info == "string") {
          peer_host = peer_host_info;
        }
        if (!peer_host) {
          return;
        }
        const { peers } = await this.fetch.get<{ peers: TYPE.PeerModel[] }>(
          this.PEERS_URL.disposableServerUrl(peer_host),
        );

        for (var i = 0, peer: typeof peers[0]; (peer = peers[i]); i += 1) {
          if (peer.state == 2) {
            all_peers.unshift(peer.ip + ":" + peer.port);
          } else if (peer.state == 1) {
            all_peers.push(peer.ip + ":" + peer.port);
          }
        }
      }),
    );

    return all_peers;
  }

  /**
   * 获取节点的同步状态
   * return 1 -- 未同步，最新
   * return number--同步状态，小数返回两位
   * return -1 -- 同步错误
   */
  async getPeerSync(host?: string) {
    if (host) {
      this.PEER_SYNC.disposableServerUrl(host);
    }

    let data = await this.fetch.get<any>(this.PEER_SYNC);
    if (data.success) {
      if (data.sync == false) {
        return 1;
      } else {
        return (1 - data.blocks / data.height).toFixed(2);
      }
    } else {
      console.log("get peer sync error");
      return -1;
    }
  }

  /**
   * 获取可用节点
   * 从未保存过时返回空数组
   */
  async getPeersLocal() {
    return (
      ((await this.peerDb.find(
        {},
        { sort: { node_quality: -1 } },
      )) as TYPE.LocalPeerModel[]) || []
    );
  }

  /**
   * 设置连接的
   * @param peer
   */
  setPeer(peer) {
    AppSettingProvider.SERVER_URL = peer;
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
  oneTimeUrl(app_url: AppUrl, server_url: string) {
    app_url.disposableServerUrl(server_url);
    return this;
  }

  static fetchPeerPortInfo(ip: string, port: number, timeout_ms = 2000) {
    return new Promise<{ success: boolean; webPort: number }>(
      (resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(
          "GET",
          `http://${ip}:${port}/api/${AppUrl.BACKEND_VERSION}system/portInfo`,
        );
        xhr.send();
        setTimeout(() => {
          xhr.abort();
        }, timeout_ms);
        xhr.onreadystatechange = _ => {
          if (xhr.readyState === 4) {
            if (xhr.responseText) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch (err) {
                reject(err);
              }
            } else {
              reject(new Error("time out"));
            }
          }
        };
      },
    );
  }
}
