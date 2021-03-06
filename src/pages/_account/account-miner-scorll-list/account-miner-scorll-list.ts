import { Component, Optional, ChangeDetectorRef, ChangeDetectionStrategy } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular/index";
import { MinServiceProvider, DelegateModel } from "../../../providers/min-service/min-service";
import { PeerServiceProvider } from "../../../providers/peer-service/peer-service";

@IonicPage({ name: "account-miner-scorll-list" })
@Component({
  selector: "page-account-miner-scorll-list",
  templateUrl: "account-miner-scorll-list.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountMinerScorllListPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public minService: MinServiceProvider,
    public peerService: PeerServiceProvider,
    public cdRef: ChangeDetectorRef
  ) {
    super(navCtrl, navParams, true, tabs);
    this.auto_header_shadow_when_scroll_down = true;
  }

  isPageCurrentList: boolean = false;
  isPageCandidateList: boolean = false;
  @AccountMinerScorllListPage.markForCheck cur_minter_rank_list?: DelegateModel[];
  @AccountMinerScorllListPage.markForCheck can_minter_rank_list?: DelegateModel[];
  async loadMinterList() {

    if (this.navParams.get('from')=== 'current') this.isPageCurrentList = true;
    if (this.navParams.get('from')=== 'candidate') this.isPageCandidateList = true;

    const cur_minter_list = await this.minService.allMinersCurRound.getPromise();
    this.cur_minter_rank_list = cur_minter_list.map((cur_minter, i) => {
      return {
        No: i + 1,
        ...cur_minter,
      };
    });

    const can_minter_list = await this.minService.minersOut.getPromise();
    this.can_minter_rank_list = can_minter_list.map((can_minter, i) => {
      return {
        No: i + cur_minter_list.length + 1,
        ...can_minter,
      };
    });

    this.cdRef.markForCheck();
  }

  @AccountMinerScorllListPage.addEvent("ROUND:CHANGED")
  @asyncCtrlGenerator.error("@@LOAD_ALL_MINER_LIST_ERROR")
  @asyncCtrlGenerator.retry()

  async watchRoundChange() {
    return this.loadMinterList();
  }

}
