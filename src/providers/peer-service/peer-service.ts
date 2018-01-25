import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppFetchProvider } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject } from "rxjs";
import { AppSettingProvider } from "../app-setting/app-setting";
import { BlockServiceProvider } from "../block-service/block-service";
import * as IFM from 'ifmchain-ibt';


/*
  Generated class for the PeerServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class PeerServiceProvider {
  ifmJs: any;
  peer: any;
  peerList: any[];
  constructor(
    public http: HttpClient,
    public storage: Storage,
    public appSetting: AppSettingProvider,
    public appFetch: AppFetchProvider,
    public blockService: BlockServiceProvider,
  ) {
    this.ifmJs = AppSettingProvider.IFMJS;
    this.peer = this.ifmJs.Api(AppSettingProvider.HTTP_PROVIDER).peer;
    this.peerList = ['http://mainnet.ifmchain.org', 'http://test1.ifmchain.org'];
  }

  /**
   * 获取节点信息
   * @param ipStr
   * @param port
   * @returns {Promise<any>}
   * ip port height health state os sharePort version
   */
  async getPeer(ipStr, port) {
    let data = await this.peer.getPeer(ipStr, port);

    if (data.success) {
      return data.peer;
    }
    return {};
  }

  /**
   * 获取正在工作的节点列表
   * @param {{}} params
   * @returns {Promise<any>}
   */
  async getPeers(params = {}) {
    let data = await this.peer.getPeers(params);

    if (data.success) {
      return data.peers;
    }

    return [];
  }

  /**
   * 获取节点高度最高的可用节点排序
   * step1 - 根据本地节点获取节点列表，读取本地的
   * step2 - 按照高度进行排序，节点状态不好的进行排除
   * step3 - ping所有节点获得从上至下的所有毫秒
   * step4 - 搜索中，超时的节点进行排除，块高度不一致的进行排除
   * step5 - 一定时间内选择高度最高的最快的节点，当不存在时选择高度第二高的最快的
   * step6 - 保存节点列表至本地，节点列表首先选择已筛选的，没有再选择配置文件中的
   */
  async sortPeers() {
    const PING_URL = '/api/blocks/getHeight';
    const PEERS_URL = '/api/peers/';
    let peers: any[];
    let peersArray: any[];
    peers = await this.getPeersLocal();
    //当不存在本地已保存的节点IP时
    //根据配置文件获取节点，再获取每一个节点的所有节点列表
    if (peers.length === 0) {
      let configPeers: Array<string> = await this.getPeersConfig();
      //异步执行异步的循环
      await Promise.all(configPeers.map(async (peer) => {
        let data = await this.appFetch.get<{ peers: any[] }>(peer + PEERS_URL);
        for (let i of data.peers) {
          //状态为1的才进行插入
          if (i.state === 1) {
            let ip_port = i.ip + ':' + i.port;
            peers.push(ip_port);
          }
        }
      }))
    }

    //获取保存的节点列表中的每一个节点的连接时间和高度
    //TODO:当n秒时放弃连接
    await Promise.all(peers.map(async (peer) => {
      let startTimestamp = new Date().getTime();
      let data = await this.appFetch.get<{ height: number }>(peer + PING_URL);
      let endTimestamp = new Date().getTime();
      let during = endTimestamp - startTimestamp;
      peersArray.push({
        "peer": peer,
        "height": data.height,
        "during": during
      })
    }))

    //对列表进行排序，根据高度进行排序，再根据速度进行筛选
    peersArray = peersArray.sort((a, b) => {
      if (a.height === b.height) {
        return a.during < b.during ? -1 : 1;
      } else {
        return a.height < b.height ? 1 : -1;
      }
    })

    this.savePeersLocal(peersArray);

    return peersArray;
  }

  async savePeersLocal(peers: Array<string>) {

  }

  async getPeersLocal() {
    return []
  }

  async getPeersConfig() {
    return []
  }

}
