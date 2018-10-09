import {
  Component,
  Optional,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams, Refresher } from "ionic-angular/index";
import {
  TransactionServiceProvider,
  TransactionTypes,
  TransactionModel,
} from "../../../providers/transaction-service/transaction-service";
import { LocalContactProvider } from "../../../providers/local-contact/local-contact";

enum TranSubPage {
  CONFIRMED = "confirmed",
  UNCONFIRM = "unconfirm",
}

@IonicPage({ name: "account-my-transaction-list" })
@Component({
  selector: "page-account-my-transaction-list",
  templateUrl: "account-my-transaction-list.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountMyTransactionListPage extends SecondLevelPage {
  TransactionTypes = TransactionTypes;
  TranSubPage = TranSubPage;
  @AccountMyTransactionListPage.markForCheck
  current_page = TranSubPage.CONFIRMED;
  gotoSubPage(page: TranSubPage) {
    if (page in TranSubPage) {
      console.warn(`${page} no via page`);
      return;
    }
    this.current_page = page;
    if (page === TranSubPage.UNCONFIRM) {
      if (this.unconfirm_transaction_list.length == 0) {
        this.loadUnconfirmTransactionList();
      }
    }
  }

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public transactionService: TransactionServiceProvider,
    public cdRef: ChangeDetectorRef,
    public localContact: LocalContactProvider
  ) {
    super(navCtrl, navParams, true, tabs);
    this.enable_timeago_clock = true;
  }

  /// 已经确认的交易

  @AccountMyTransactionListPage.markForCheck
  confirmed_transaction_list: TransactionModel[] = [];
  confirmed_transaction_config = {
    loading: false,
    has_more: true,
    pageSize: 20,
    page: 1,
  };

  async loadConfirmedTransactionList() {
    const { confirmed_transaction_config } = this;
    // 重置分页
    confirmed_transaction_config.page = 1;
    const list = await this._getUserConfirmedTransactions();
    this.confirmed_transaction_list = list;
  }

  /**更新已确认的交易列表中本地联系人的名字*/
  @AccountMyTransactionListPage.willEnter
  async updateConfirmTransactionList() {
    this.confirmed_transaction_list = await this.localContact.formatTransactionWithLoclContactNickname(
      this.confirmed_transaction_list
    );
  }

  @asyncCtrlGenerator.error("@@LOAD_MORE_CONFIRMED_TRANSACTION_LIST_ERROR")
  async loadMoreConfirmedTransactionList() {
    const { confirmed_transaction_config } = this;
    confirmed_transaction_config.page += 1;
    const list = await this._getUserConfirmedTransactions();

    this.confirmed_transaction_list.push(...list);
    this.markForCheck();
  }
  private async _getUserConfirmedTransactions() {
    const { confirmed_transaction_config } = this;
    confirmed_transaction_config.loading = true;
    this.markForCheck();
    try {
      const list = await this.transactionService.getUserTransactions(
        this.userInfo.address,
        confirmed_transaction_config.page,
        confirmed_transaction_config.pageSize,
        "or",
        "all"
      );
      confirmed_transaction_config.has_more =
        list.length >= confirmed_transaction_config.pageSize;
      return this.localContact.formatTransactionWithLoclContactNickname(list);
    } finally {
      confirmed_transaction_config.loading = false;
      this.markForCheck();
    }
  }

  private _is_from_child = false;
  /**跳转到交易详情页面*/
  routeToTransactionDetail(tran: TransactionModel) {
    this.unconfirm_transaction_list = this.unconfirm_transaction_list.filter(
      trs => !trs["__remove"]
    );
    return this.routeTo("chain-transaction-detail", { transaction: tran }).then(
      () => (this._is_from_child = true)
    );
  }

  /// 还未确认的交易
  @AccountMyTransactionListPage.markForCheck
  unconfirm_transaction_list: TransactionModel[] = [];
  unconfirm_transaction_config = {
    loading: false,
    has_more: true,
    pageSize: 20,
    offset: 0,
  };

  async loadUnconfirmTransactionList(refresher?: Refresher) {
    const { unconfirm_transaction_config } = this;
    // 重置分页
    unconfirm_transaction_config.offset = 0;
    const list = await this._getUserUnconfirmTransactions();
    this.unconfirm_transaction_list = list;
    if (refresher) {
      refresher.complete();
    }
  }

  /**更新未确认的交易列表中本地联系人的名字*/
  @AccountMyTransactionListPage.willEnter
  async updateUnconfirmTransactionList() {
    this.unconfirm_transaction_list = await this.localContact.formatTransactionWithLoclContactNickname(
      this.unconfirm_transaction_list
    );
  }

  @asyncCtrlGenerator.error("@@LOAD_MORE_UNCONFIRM_TRANSACTION_LIST_ERROR")
  async loadMoreUnconfirmTransactionList() {
    const { unconfirm_transaction_config } = this;
    unconfirm_transaction_config.offset +=
      unconfirm_transaction_config.pageSize;
    const list = await this._getUserUnconfirmTransactions();

    this.unconfirm_transaction_list.push(...list);
    this.markForCheck();
  }
  private async _getUserUnconfirmTransactions() {
    const { unconfirm_transaction_config } = this;
    unconfirm_transaction_config.loading = true;
    this.markForCheck();
    try {
      const list = await this.transactionService.getLocalUnconfirmedAndCheck(
        unconfirm_transaction_config.offset,
        unconfirm_transaction_config.pageSize,
        {
          timestamp: -1,
        }
      );
      unconfirm_transaction_config.has_more =
        list.length >= unconfirm_transaction_config.pageSize;
      return this.localContact.formatTransactionWithLoclContactNickname(list);
    } finally {
      unconfirm_transaction_config.loading = false;
      this.markForCheck();
    }
  }

  /**重新发送交易*/
  async confirmToRetry(tra: TransactionModel) {
    if (
      await this.waitTipDialogConfirm("@@CONFIRM_TO_RESEND_TRANSACTION", {
        true_text: "@@RESEND_TRANSACTION",
      })
    ) {
      return this._resendUnconfirmTransaction(tra);
    }
  }
  @asyncCtrlGenerator.error("@@TRANSACTION_RESEND_FAIL")
  @asyncCtrlGenerator.success("@@TRANSACTION_RESEND_SUCCESS")
  private async _resendUnconfirmTransaction(tra: TransactionModel) {
    await this.transactionService.putThirdTransaction(tra);
  }
  /**删除未确认交易*/
  async confirmToDelete(tra: TransactionModel) {
    if (
      await this.waitTipDialogConfirm("@@CONFIRM_DELETE", {
        true_text: "@@REMOVE",
      })
    ) {
      return this._deleteUnconfirmTransaction(tra);
    }
  }
  @asyncCtrlGenerator.error("@@TRANSACTION_DELETE_FAIL")
  private async _deleteUnconfirmTransaction(tra: TransactionModel) {
    await this.transactionService.unTxDb.remove({ _id: tra["_id"] });
    const { unconfirm_transaction_config, unconfirm_transaction_list } = this;
    const index = unconfirm_transaction_list.indexOf(tra);
    tra["__remove"] = true;
    this.markForCheck();
    // if (index !== -1) {
    //   unconfirm_transaction_config.offset -= 1;
    //   unconfirm_transaction_list.splice(index, 1);
    //   this.markForCheck();
    // }
  }

  /// 自动更新
  @AccountMyTransactionListPage.addEvent("HEIGHT:CHANGED")
  @asyncCtrlGenerator.error(
    "@@UPDATE_TRANSACTION_FAILED-TOO_MANY_RETRIES-HAS_STOPPED_RETRY-PLEASE_CHECK_THE_NETWORK"
  )
  @asyncCtrlGenerator.retry()
  watchHeightChanged() {
    return Promise.all([
      this.loadConfirmedTransactionList(),
      this.loadUnconfirmTransactionList(),
    ]);
  }
}
