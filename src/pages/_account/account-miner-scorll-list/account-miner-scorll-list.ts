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

    const params = this.navParams.get('from');

    if (params === 'current') {
      this.isPageCurrentList = true;
      this.cur_minter_rank_list = await this.minService.allMinersCurRound.getPromise();
    }else{
      this.cur_minter_rank_list = [];
      this.isPageCurrentList = false;
    }

    if (params === 'candidate') {
      this.isPageCandidateList = true;
      this.can_minter_rank_list = await this.minService.minersOut.getPromise();
    }else{
      this.can_minter_rank_list = [];
      this.isPageCandidateList = false;
    }

    this.cdRef.markForCheck();
  }

  @AccountMinerScorllListPage.addEvent("ROUND:CHANGED")
  @asyncCtrlGenerator.error("@@LOAD_ALL_MINER_LIST_ERROR")
  @asyncCtrlGenerator.retry()

  async watchRoundChange() {
    return this.loadMinterList();
  }

}
