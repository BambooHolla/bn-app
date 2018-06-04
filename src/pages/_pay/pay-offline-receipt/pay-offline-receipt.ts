import { Component, Optional, ViewChild } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import {
	IonicPage,
	NavController,
	NavParams,
	Refresher,
	Content,
} from "ionic-angular";
import {
	TransactionServiceProvider,
	TransactionTypes,
	TransactionModel,
} from "../../../providers/transaction-service/transaction-service";

@IonicPage({ name: "pay-offline-receipt" })
@Component({
	selector: "page-pay-offline-receipt",
	templateUrl: "pay-offline-receipt.html",
})
export class PayOfflineReceiptPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		public transactionService: TransactionServiceProvider,
		@Optional() public tabs: TabsPage,
	) {
		super(navCtrl, navParams, true, tabs);
	}

	transaction_binary!: string;
	tran!: TransactionModel;
	@PayOfflineReceiptPage.willEnter
	initData() {
		const transaction = this.navParams.get("transaction");
		if (!transaction) {
			return this.navCtrl.goToRoot({});
		}
		this.tran = transaction;
		this.transaction_binary =
			"ifmchain-transaction://" + JSON.stringify({ T: this.tran });
	}
}
