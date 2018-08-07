import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams, Refresher } from "ionic-angular";
import {
  TransactionServiceProvider,
  TransactionTypes,
  TransactionModel,
} from "../../../providers/transaction-service/transaction-service";

enum TranSubPage {
  CONFIRMED = "confirmed",
  UNCONFIRM = "unconfirm",
}

@IonicPage({ name: "account-my-transaction-list" })
@Component({
  selector: "page-account-my-transaction-list",
  templateUrl: "account-my-transaction-list.html",
})
export class AccountMyTransactionListPage extends SecondLevelPage {
  TransactionTypes = TransactionTypes;
  TranSubPage = TranSubPage;
  current_page = TranSubPage.CONFIRMED;
  gotoSubPage(page: TranSubPage) {
    if (page in TranSubPage) {
      console.warn(`${page} no via page`);
      return;
    }
    this.current_page = page;
  }

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public transactionService: TransactionServiceProvider
  ) {
    super(navCtrl, navParams, true, tabs);
    this.enable_timeago_clock = true;
  }

  listTrackBy(index, item: TransactionModel) {
    return item.id;
  }

  /// 已经确认的交易
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

  @asyncCtrlGenerator.error(() =>
    AccountMyTransactionListPage.getTranslate(
      "LOAD_MORE_CONFIRMED_TRANSACTION_LIST_ERROR"
    )
  )
  async loadMoreConfirmedTransactionList() {
    const { confirmed_transaction_config } = this;
    confirmed_transaction_config.page += 1;
    const list = await this._getUserConfirmedTransactions();

    this.confirmed_transaction_list
      ? this.confirmed_transaction_list.push(...list)
      : (this.confirmed_transaction_list = list);
  }
  private async _getUserConfirmedTransactions() {
    const { confirmed_transaction_config } = this;
    confirmed_transaction_config.loading = true;
    try {
      const list = await this.transactionService.getUserTransactions(
        this.userInfo.address,
        confirmed_transaction_config.page,
        confirmed_transaction_config.pageSize,
        "or"
      );
      confirmed_transaction_config.has_more =
        list.length >= confirmed_transaction_config.pageSize;
      return list;
    } finally {
      confirmed_transaction_config.loading = false;
    }
  }

  /// 还未确认的交易

  unconfirm_transaction_list: TransactionModel[] = [];
  unconfirm_transaction_config = {
    loading: false,
    has_more: true,
    pageSize: 20,
    page: 1,
  };
  async loadUnconfirmTransactionList(refresher?: Refresher) {
    const { unconfirm_transaction_config } = this;
    // 重置分页
    unconfirm_transaction_config.page = 1;
    const list = await this._getUserUnconfirmTransactions();
    this.unconfirm_transaction_list = list;
    if (refresher) {
      refresher.complete();
    }
  }

  @asyncCtrlGenerator.error(() =>
    AccountMyTransactionListPage.getTranslate(
      "LOAD_MORE_UNCONFIRM_TRANSACTION_LIST_ERROR"
    )
  )
  async loadMoreUnconfirmTransactionList() {
    const { unconfirm_transaction_config } = this;
    unconfirm_transaction_config.page += 1;
    const list = await this._getUserUnconfirmTransactions();

    this.unconfirm_transaction_list
      ? this.unconfirm_transaction_list.push(...list)
      : (this.unconfirm_transaction_list = list);
  }
  private async _getUserUnconfirmTransactions() {
    const { unconfirm_transaction_config } = this;
    unconfirm_transaction_config.loading = true;
    try {
      const list = await this.transactionService.getUnconfirmed(
        unconfirm_transaction_config.page,
        unconfirm_transaction_config.pageSize
      );
      unconfirm_transaction_config.has_more =
        list.length >= unconfirm_transaction_config.pageSize;
      return list;
    } finally {
      unconfirm_transaction_config.loading = false;
    }
  }

  /// 自动更新
  @AccountMyTransactionListPage.addEvent("HEIGHT:CHANGED")
  @asyncCtrlGenerator.error(() =>
    AccountMyTransactionListPage.getTranslate(
      "UPDATE_TRANSACTION_FAILED-TOO_MANY_RETRIES-HAS_STOPPED_RETRY-PLEASE_CHECK_THE_NETWORK"
    )
  )
  @asyncCtrlGenerator.retry()
  watchHeightChanged() {
    return this.loadConfirmedTransactionList();
  }
}
