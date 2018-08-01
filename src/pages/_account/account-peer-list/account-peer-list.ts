import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
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
    // for await (var _pi of this.peerService.searchAndCheckPeers()) {
    //   if ("peer" in _pi) {
    //     const checked_peer_info = _pi;
    //     this.cur_peer_list.push(checked_peer_info.peer);
    //   }
    // }
  }
}
