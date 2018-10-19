import {
  Component,
  Optional,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { sleep } from "../../../bnqkl-framework/PromiseExtends";
import { TabsPage } from "../../tabs/tabs";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
} from "ionic-angular/index";
import {
  PeerServiceProvider,
  LocalPeerModel,
} from "../../../providers/peer-service/peer-service";
import { BlockServiceProvider } from "../../../providers/block-service/block-service";
import { AppSettingProvider } from "../../../providers/app-setting/app-setting";

@IonicPage({ name: "linked-peer-list" })
@Component({
  selector: "page-linked-peer-list",
  templateUrl: "linked-peer-list.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkedPeerListPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public peerService: PeerServiceProvider,
    public blockService: BlockServiceProvider,
    public viewCtrl: ViewController,
    public cdRef: ChangeDetectorRef
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  @LinkedPeerListPage.markForCheck using_peer_list: LocalPeerModel[] = [];
  @LinkedPeerListPage.willEnter
  async initPeerList() {
    const peer = await this.peerService.peerDb.findOne({
      origin: this.baseConfig.SERVER_URL,
    });
    if (peer) {
      if (!peer.acc_use_duration) {
        peer.acc_use_duration = 0;
      }
      this.using_peer_list = [peer];
      let ti = setInterval(() => {
        if (this.PAGE_STATUS < this.PAGE_STATUS_ENUM.DID_LEAVE) {
          peer.acc_use_duration += 1;
          this.markForCheck();
        }
      }, 1000);
    }
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }
}
