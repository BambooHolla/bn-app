import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { sleep } from "../../../bnqkl-framework/PromiseExtends";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import {
  PeerServiceProvider,
  LocalPeerModel,
} from "../../../providers/peer-service/peer-service";

@IonicPage({name:"linked-peer-list"})
@Component({
  selector: 'page-linked-peer-list',
  templateUrl: 'linked-peer-list.html',
})
export class LinkedPeerListPage extends SecondLevelPage{

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public peerService: PeerServiceProvider,
  ) {
    super(navCtrl, navParams, true, tabs);
  }

using_peer_list:LocalPeerModel[] = []
}
