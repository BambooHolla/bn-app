import { Component, Optional } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
} from "ionic-angular";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import {
  TransactionServiceProvider,
  TransactionTypes,
  TransactionModel,
} from "../../../providers/transaction-service/transaction-service";
import {
  LocalContactModel,
  LocalContactProvider,
} from "../../../providers/local-contact/local-contact";
import { AccountServiceProvider } from "../../../providers/account-service/account-service";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";

@IonicPage({ name: "account-contact-detail" })
@Component({
  selector: "page-account-contact-detail",
  templateUrl: "account-contact-detail.html",
})
export class AccountContactDetailPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public accountService: AccountServiceProvider,
    public localContact: LocalContactProvider,
    public viewCtrl: ViewController,
    public transactionService: TransactionServiceProvider,
  ) {
    super(navCtrl, navParams, true, tabs);
    this.enable_timeago_clock = true;
    this.event.on("job-finished", ({ id, data }) => {
      switch (id) {
        case "account-remark-contact":
          if (this.contact && data.updated_contact._id === this.contact._id) {
            this.contact = data.updated_contact;
            this.markForCheck();
          }
          break;
      }
    });
  }
  contact?: LocalContactModel;
  get mainname() {
    const { contact } = this;
    if (contact) {
      return contact.nickname || contact.username;
    }
  }
  get username() {
    const { contact } = this;
    if (contact && contact.nickname) {
      return contact.username;
    }
  }
  private _is_back_from_remark_contact_editor = false;

  @AccountContactDetailPage.willEnter
  initData() {
    if (this._is_back_from_remark_contact_editor) {
      this._is_back_from_remark_contact_editor = false;
      return;
    }
    const contact = this.navParams.get("contact");
    if (!contact) {
      return this.navCtrl.goToRoot({});
    }
    this.contact = contact;
  }
  /*跳转到编辑页面*/
  goToEditContact() {
    this._is_back_from_remark_contact_editor = true;
    this.routeTo("account-remark-contact", {
      contact: this.contact,
      auto_return: true,
    });
  }

  transaction_list: TransactionModel[] = [];
  transaction_config = {
    loading: false,
    has_more: true,
    pageSize: 20,
    page: 1,
  };
  private async _getTransactionList() {
    const { transaction_config } = this;
    transaction_config.loading = true;
    try {
      if (!this.contact) {
        return [];
      }
      const list = await this.transactionService.getUserTransactions(
        this.contact.address,
        transaction_config.page,
        transaction_config.pageSize,
        "or",
      );
      transaction_config.has_more = list.length >= transaction_config.pageSize;
      return list;
    } finally {
      transaction_config.loading = false;
    }
  }
  listTrackBy(index, item: TransactionModel) {
    return item.id;
  }

  TransactionTypes = TransactionTypes;
  @AccountContactDetailPage.willEnter
  @asyncCtrlGenerator.error()
  async getTransactionLogs() {
    this.transaction_config.page = 1;
    this.transaction_list = await this._getTransactionList();
    this.markForCheck();
  }

  @asyncCtrlGenerator.error()
  async getMoreTransactionLogs() {
    try {
      this.transaction_config.page += 1;
      this.transaction_list.push(...(await this._getTransactionList()));
    } catch (err) {
      this.transaction_config.page -= 1;
    }
    this.markForCheck();
  }

  /*隐藏功能*/
  @asyncCtrlGenerator.tttttap()// 这个要放第一个
  @asyncCtrlGenerator.error()
  @asyncCtrlGenerator.loading()
  async tryShowAccountBalanceDetail() {
    if (!this.contact) {
      throw new Error("没有联系人");
    }
    const accountInfo = await this.accountService.getAccountByAddress(
      this.contact.address,
    );
    return this.showSuccessDialog(
      "资产信息",
      `余额：${accountInfo.balance}`,
      `挖矿收益：${accountInfo.votingReward}`,
    );
  }
}
