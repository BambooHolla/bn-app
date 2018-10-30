import { Component, Optional, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular/index";
import { TransactionModel, TransactionTypes } from "../../../providers/transaction-service/transaction-service";
import { LocalContactProvider, LocalContactModel } from "../../../providers/local-contact/local-contact";
import { Buffer } from "buffer";
import { City, translateCity } from "../../../datx";

@IonicPage({ name: "chain-transaction-detail" })
@Component({
  selector: "page-chain-transaction-detail",
  templateUrl: "chain-transaction-detail.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChainTransactionDetailPage extends SecondLevelPage {
  private static _city_data?: Promise<City>;
  static get ipcity() {
    if (!this._city_data) {
      this._city_data = fetch("./assets/17monipdb.datx")
        .then(res => res.arrayBuffer())
        .then(data => new City(Buffer.from(data)));
    }
    return this._city_data;
  }
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public localContact: LocalContactProvider,
    public cdRef: ChangeDetectorRef,
  ) {
    super(navCtrl, navParams, true, tabs);
    this.auto_header_shadow_when_scroll_down = true;
  }

  @ChainTransactionDetailPage.detectChanges
  ripple_theme = "blue-ripple";
  @ChainTransactionDetailPage.willEnter
  initRippleTheme() {
    const ripple_theme = this.navParams.get("ripple_theme");
    if (ripple_theme) {
      this.ripple_theme = ripple_theme;
    }
  }

  @ChainTransactionDetailPage.markForCheck
  transaction?: TransactionModel;
  @ChainTransactionDetailPage.markForCheck
  transaction_ip_country = "";
  @ChainTransactionDetailPage.willEnter
  setTransactionData() {
    const transaction: TransactionModel = this.navParams.get("transaction");
    if (!transaction) {
      return this.navCtrl.goToRoot({});
    }

    this.transaction = transaction;

    // 寻找ip地址
    ChainTransactionDetailPage.ipcity.then(city => {
      if (!transaction["sourceIP"]) {
        return;
      }
      const city_info = city.findSync(transaction["sourceIP"]);
      if (city_info) {
        translateCity(city_info[0], k => this.getTranslateSync(k)).then(translated_city => {
          this.transaction_ip_country = translated_city;
        });
      }
    });

    // 匹配本地联系人信息
    this.matchMyContact();
  }

  /**是否是投票交易 */
  get is_vote_transaction() {
    return this.transaction && this.transaction.type === TransactionTypes.VOTE;
  }
  /**跳转到投票交易详情 */
  routeToVoteTransactionDelegateList() {
    if (this.transaction) {
      this.routeTo("chain-vote-transaction-delegate-list", {
        transaction_id: this.transaction.id
      });
    }
  }

  @ChainTransactionDetailPage.markForCheck
  recipient_contact?: LocalContactModel;
  @ChainTransactionDetailPage.markForCheck
  sender_contact?: LocalContactModel;
  contact_metched_map = new Map<string, LocalContactModel>();

  async matchMyContact() {
    const { transaction } = this;
    if (!transaction) {
      return;
    }
    const tasks: Promise<any>[] = [];
    if (transaction.recipientId) {
      tasks[tasks.length] = this.localContact.findContact(transaction.recipientId).then(v => {
        if (v) {
          this.recipient_contact = v;
          this.contact_metched_map.set(v.address, v);
        }
      });
    }
    if (transaction.senderId) {
      tasks[tasks.length] = this.localContact.findContact(transaction.senderId).then(v => {
        if (v) {
          this.sender_contact = v;
          this.contact_metched_map.set(v.address, v);
        }
      });
    }
    await Promise.all(tasks);
  }

  // @asyncCtrlGenerator.error()
  // @asyncCtrlGenerator.loading()
  routeToDetail(address: string) {
    const contact = this.contact_metched_map.get(address);
    // const account = await this.accountService.getAccountByAddress(address);
    return this.routeTo("account-contact-detail", { contact, address });
  }
}
