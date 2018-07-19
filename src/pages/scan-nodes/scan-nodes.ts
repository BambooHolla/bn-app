import { Component, ViewChild, ElementRef } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { ChainMeshComponent } from "../../components/chain-mesh/chain-mesh";
import {
  PeerServiceProvider,
  LocalPeerModel,
  PEER_LEVEL,
} from "../../providers/peer-service/peer-service";
import { NetworkInterface } from "@ionic-native/network-interface";

@IonicPage({ name: "scan-nodes" })
@Component({
  selector: "page-scan-nodes",
  templateUrl: "scan-nodes.html",
})
export class ScanNodesPage extends FirstLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public peerService: PeerServiceProvider,
    public networkInterface: NetworkInterface,
  ) {
    super(navCtrl, navParams);
  }

  peer_list: LocalPeerModel[] = [];
  peer_searcher?: ReturnType<
    typeof PeerServiceProvider.prototype.searchAndCheckPeers
  >;
  @ScanNodesPage.willEnter
  async scanNodes() {
    this.peer_searcher = this.peerService.searchAndCheckPeers({
      manual_check_peers: true, // 手动控制检查节点：先关闭节点检查，全力搜索节点，等够了，在开始节点检查
    });
    const levelMap: any = {};
    // 开始请求节点延迟信息
    for await (var _r of this.peer_searcher) {
      if ("height" in _r) {
        this._calcPeerPos(_r);
        this.peer_list.push(_r);
        levelMap[_r.level] = (levelMap[_r.level] | 0) + 1;
        if (this.isEnableStartCheckPeers(levelMap)) {
          break;
        }
      } else if ("search_done" in _r) {
        break;
      }
    }
    // this.gotoLinkNodes();
  }

  /*根据服务的IP算出坐标*/
  private _calcPeerPos(peer: LocalPeerModel) {
    // peer._pos_top
    const ipinfo = peer.ip.split(".");
    const deg =
      (((parseInt(ipinfo[0]) << 8) + parseInt(ipinfo[1])) / 0xffff) *
      Math.PI *
      2;
    const dis = ((parseInt(ipinfo[2]) << 8) + parseInt(ipinfo[3])) / 0xffff;
    const cxy = [Math.cos(deg) * dis, Math.sin(deg) * dis];
    peer["_pos_left"] = ((cxy[0] + 1) / 2) * 100;
    peer["_pos_top"] = ((cxy[1] + 1) / 2) * 100;
  }

  /*判断是否可以开始检查节点了*/
  isEnableStartCheckPeers(levelMap: any) {
    return (
      levelMap[PEER_LEVEL.SEC_TRUST] >= 4 || levelMap[PEER_LEVEL.OTHER] >= 57
    );
  }

  gotoLinkNodes() {
    return this.routeTo(
      "link-node",
      {
        peer_searcher: this.peer_searcher,
        peer_list: this.peer_list,
      },
      {
        animation: "wp-transition",
      },
    );
  }
}
