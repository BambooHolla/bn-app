import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { sleep } from "../../../bnqkl-framework/PromiseExtends";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import {
  PeerServiceProvider,
  LocalPeerModel,
} from "../../../providers/peer-service/peer-service";

@IonicPage({ name: "account-peer-list" })
@Component({
  selector: "page-account-peer-list",
  templateUrl: "account-peer-list.html",
})
export class AccountPeerListPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public peerService: PeerServiceProvider,
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  cur_peer_list: LocalPeerModel[] = [];
  @AccountPeerListPage.willEnter
  async initPeerList() {
    this.cur_peer_list = this.peerService.useablePeers();
    if (sessionStorage.getItem("STOP_UPDATE_PEER_LIST") !== "true") {
      sessionStorage.setItem("STOP_UPDATE_PEER_LIST", "true");
      // 更新节点信息
      return this.loopUpdatePeerList();
    }
  }
  async loopUpdatePeerList() {
    const min_wait_time = sleep(5000); // 至少每5秒要更新一次数据
    for await (var _pi of this.peerService.updateUseablePeersInfo(
      this.cur_peer_list,
    )) {
      if (this.PAGE_STATUS <= this.PAGE_STATUS_ENUM.WILL_LEAVE) {
        break;
      }
      this.markForCheck();
    }
    await min_wait_time;
    // this.loopUpdatePeerList();
  }
}
