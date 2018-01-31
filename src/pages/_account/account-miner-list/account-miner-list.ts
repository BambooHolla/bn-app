import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { MinServiceProvider } from "../../../providers/min-service/min-service";
import { PeerServiceProvider } from "../../../providers/peer-service/peer-service";

@IonicPage({ name: "account-miner-list" })
@Component({
  selector: "page-account-miner-list",
  templateUrl: "account-miner-list.html",
})
export class AccountMinerListPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public minService: MinServiceProvider,
    public peerService: PeerServiceProvider,
  ) {
    super(navCtrl, navParams, true, tabs);
    this.auto_header_shadow_when_scroll_down = true;
  }
  cur_minter_rank_list: any[];
  can_minter_rank_list: any[];
  get show_cur_minter_rank_list() {
    return this.cur_minter_rank_list
      ? this.cur_minter_rank_list.slice(0, 4)
      : [];
  }
  get show_can_minter_rank_list() {
    return this.can_minter_rank_list
      ? this.can_minter_rank_list.slice(0, 4)
      : [];
  }

  cur_peer_list: any[];

  @AccountMinerListPage.willEnter
  async initMinterList() {
    const cur_minter_list = await this.minService.getAllMiners(1, 4);

    this.cur_minter_rank_list = cur_minter_list.map((cur_minter, i) => {
      return {
        No: i + 1,
        ...cur_minter,
      };
    });

    const can_minter_list = await this.minService.getAllMinersOutside(1, 4);
    this.can_minter_rank_list = can_minter_list.map((can_minter, i) => {
      return {
        No: i + 1,
        ...can_minter,
      };
    });
  }
  @AccountMinerListPage.willEnter
  async initPeerList() {
    const peer_list = await this.peerService.getPeersLocal();
    this.cur_peer_list = peer_list.map(peer => ({
      ...peer,
      linked_number: (Math.random() * 50) | 0,
    }));
  }
}
