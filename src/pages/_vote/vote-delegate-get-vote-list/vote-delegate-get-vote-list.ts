import { Component, Optional, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular/index";
import { PromisePro } from "../../../bnqkl-framework/PromiseExtends";
import { MinServiceProvider, DelegateModel, DELEGATE_VOTEABLE, AccountModelWithEquity } from "../../../providers/min-service/min-service";
import { VoteDelegateDetailBasePage } from "../vote-delegate-detail/vote-delegate-detail-base";
import { LocalContactProvider, AccountWithNicknameModel } from "../../../providers/local-contact/local-contact";

@IonicPage({ name: "vote-delegate-get-vote-list" })
@Component({
  selector: "page-vote-delegate-get-vote-list",
  templateUrl: "vote-delegate-get-vote-list.html",
})
export class VoteDelegateGetVoteListPage extends VoteDelegateDetailBasePage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public cdRef: ChangeDetectorRef,
    public minService: MinServiceProvider,
    public localContact: LocalContactProvider
  ) {
    super(navCtrl, navParams, tabs, minService, cdRef);
  }
  vote_list: AccountModelWithEquity[] = [];
  @VoteDelegateGetVoteListPage.addEvent("HEIGHT:CHANGED")
  watchHeightChanged() {
    return this.initVoteDetails();
  }
  //#region 列表数据的加载

  voter_list: AccountWithNicknameModel<AccountModelWithEquity>[] = [];
  page_info = {
    page: 1,
    pageSize: 20,
    loading: false,
    hasMore: true,
  };
  async initVoteDetails() {
    // 重新开始分页加载
    this.page_info.page = 1;
    this.voter_list = await this._getVotedDetails();
  }
  async loadMoreVoteDetails() {
    const { page_info } = this;
    if (page_info.loading || !page_info.hasMore) {
      return;
    }
    page_info.page += 1;
    const voter_list = await this._getVotedDetails();
    this.voter_list = this.voter_list.concat(voter_list);
  }

  @asyncCtrlGenerator.error("@@GET_DELEGATE_VOTED_DETAIL_ERROR")
  private async _getVotedDetails() {
    const delegate_info = await this.wait_delegate_info.promise;
    const { page_info } = this;
    page_info.loading = true;
    try {
      const voter_list = await this.minService.getPreRoundDelegateVotedDetail(delegate_info.address, page_info.page, page_info.pageSize);
      page_info.hasMore = voter_list.length === page_info.pageSize;
      return await this.localContact.formatAccountWidthLoclContactNickname(voter_list);
    } finally {
      page_info.loading = false;
    }
  }
  //#endregion
}
