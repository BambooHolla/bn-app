import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { TransactionModel } from "../../../providers/transaction-service/transaction-service";

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
  }
}
