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

@IonicPage({ name: "chain-transaction-detail" })
@Component({
  selector: "page-chain-transaction-detail",
  templateUrl: "chain-transaction-detail.html",
})
export class ChainTransactionDetailPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public localContact: LocalContactProvider,
  ) {
    super(navCtrl, navParams, true, tabs);
    this.auto_header_shadow_when_scroll_down = true;
  }
  transaction?: TransactionModel;
  @ChainTransactionDetailPage.willEnter
  setTransactionData() {
    const transaction = this.navParams.get("transaction");
    if (!transaction) {
      return this.navCtrl.goToRoot({});
    }
    this.transaction = transaction;

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
