import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { TransactionModel } from "../../../providers/transaction-service/transaction-service";
import {
  LocalContactProvider,
  LocalContactModel,
} from "../../../providers/local-contact/local-contact";
import { Buffer } from "buffer";
import { City } from "../../../datx";

@IonicPage({ name: "chain-transaction-detail" })
@Component({
  selector: "page-chain-transaction-detail",
  templateUrl: "chain-transaction-detail.html",
})
export class ChainTransactionDetailPage extends SecondLevelPage {
  private static _city_data?: Promise<City>;
  static get ipcity() {
    if (!this._city_data) {
      this._city_data = fetch("http://192.168.16.224:8080/17monipdb.datx")
        .then(res => res.arrayBuffer())
        .then(data => new City(Buffer.from(data)));
    }
    return this._city_data;
  }
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public localContact: LocalContactProvider
  ) {
    super(navCtrl, navParams, true, tabs);
    this.auto_header_shadow_when_scroll_down = true;
  }
  transaction?: TransactionModel;
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
      if (!transaction["sourceIp"]) {
        return;
      }
      const city_info = city.findSync(transaction["sourceIp"]);
      if (city_info) {
        this.transaction_ip_country = city_info[0];
      }
    });

    // 匹配本地联系人信息
    this.matchMyContact();
  }

  recipient_contact?: LocalContactModel;
  sender_contact?: LocalContactModel;
  contact_metched_map = new Map<string, LocalContactModel>();

  async matchMyContact() {
    const { transaction } = this;
    if (!transaction) {
      return;
    }
    const tasks: Promise<any>[] = [];
    if (transaction.recipientId) {
      tasks[tasks.length] = this.localContact
        .findContact(transaction.recipientId)
        .then(v => {
          if (v) {
            this.recipient_contact = v;
            this.contact_metched_map.set(v.address, v);
          }
        });
    }
    if (transaction.senderId) {
      tasks[tasks.length] = this.localContact
        .findContact(transaction.senderId)
        .then(v => {
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
