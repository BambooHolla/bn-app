import { Component, Optional, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular/index";
import { TransactionModel } from "../../../providers/transaction-service/transaction-service";
import { LocalContactProvider, LocalContactModel } from "../../../providers/local-contact/local-contact";
import { MinServiceProvider, DelegateModel } from "../../../providers/min-service/min-service";
import { TransactionServiceProvider } from "../../../providers/transaction-service/transaction-service";
import { ParallelPool } from "../../../bnqkl-framework/PromiseExtends";

@IonicPage({ name: "chain-vote-transaction-delegate-list" })
@Component({
  selector: "page-chain-vote-transaction-delegate-list",
  templateUrl: "chain-vote-transaction-delegate-list.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChainVoteTransactionDelegateListPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public localContact: LocalContactProvider,
    public minService: MinServiceProvider,
    public cdRef: ChangeDetectorRef,
    public transactionService: TransactionServiceProvider
  ) {
    super(navCtrl, navParams, true, tabs);
    this.auto_header_shadow_when_scroll_down = true;
  }
  /**交易ID*/
  transaction_id = "";

  /**数据初始化*/
  @ChainVoteTransactionDelegateListPage.willEnter
  async initData() {
    const transaction_id: string = this.navParams.get("transaction_id");
    if (!transaction_id) {
      return this.navCtrl.goToRoot({});
    }
    this.transaction_id = transaction_id;

    /// 加载页面数据
    this.initVotedDelegateList();
  }

  @ChainVoteTransactionDelegateListPage.markForCheck voted_delegate_list: DelegateModel[] = [];
  page_info = {
    loading: false,
    has_more: true,
    page: 1,
    pageSize: 20,
  };
  @asyncCtrlGenerator.error()
  async initVotedDelegateList() {
    this.page_info.page = 1;
    this.voted_delegate_list = await this._loadVotedDelegateList();
  }
  @asyncCtrlGenerator.error()
  async loadMoreVotedDelegateList() {
    if (!this.page_info.has_more) {
      return;
    }
    this.page_info.page += 1;
    this.voted_delegate_list = this.voted_delegate_list.concat(await this._loadVotedDelegateList());
  }

  private async _loadVotedDelegateList() {
    const { page_info, transaction_id } = this;
    try {
      page_info.loading = true;
      const voted_delegate_list = await this.transactionService.getVotedDelegateByTrsId(
        transaction_id,
        (page_info.page - 1) * page_info.pageSize,
        page_info.pageSize
      );
      page_info.has_more = voted_delegate_list.length >= page_info.pageSize;
      return voted_delegate_list;
    } finally {
      page_info.loading = false;
    }
  }
  // /**更新委托人列表的数据信息 */
  // @asyncCtrlGenerator.error()
  // private async _loadDelegateListDetail() {
  //   const { voted_delegate_list } = this;
  //   const pp = new ParallelPool<void>(4);
  //   voted_delegate_list.forEach((delegate) => {
  //     pp.addTaskExecutor(async () => {
  //       const delegate_detail = await this.minService.getDelegateInfo(delegate.publicKey);
  //       Object.assign(delegate, delegate_detail);
  //       this.markForCheck();
  //     });
  //   });
  //   await pp.yieldResults({ ignore_error: true });
  // }

  /**跳转到委托人得票页面*/
  routeToDelegateGetVoteList(delegate) {
    this.routeTo("vote-delegate-get-vote-list", { delegate_info: delegate });
  }
}
