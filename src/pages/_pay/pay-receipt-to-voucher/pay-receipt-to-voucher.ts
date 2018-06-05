import { Component, Optional, ViewChild, ElementRef } from "@angular/core";
import {
	IonicPage,
	NavController,
	ViewController,
	NavParams,
} from "ionic-angular";

import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import {
	TransactionServiceProvider,
	TransactionTypes,
	TransactionModel,
} from "../../../providers/transaction-service/transaction-service";
import {
	VoucherServiceProvider,
	ExchangeStatus,
	VocherModel,
} from "../../../providers/voucher-service/voucher-service";

@IonicPage({ name: "pay-receipt-to-voucher" })
@Component({
	selector: "page-pay-receipt-to-voucher",
	templateUrl: "pay-receipt-to-voucher.html",
})
export class PayReceiptToVoucherPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		public transactionService: TransactionServiceProvider,
		public viewCtrl: ViewController,
		@Optional() public tabs: TabsPage,
		public voucherService: VoucherServiceProvider,
	) {
		super(navCtrl, navParams, true, tabs);
	}

	transaction!: TransactionModel;
	@PayReceiptToVoucherPage.willEnter
	initData() {
		const transaction = this.navParams.get(
			"transaction",
		) as TransactionModel;
		if (!transaction) {
			return this.navCtrl.goToRoot({});
		}
		this.transaction = transaction;
	}
	@asyncCtrlGenerator.error()
	async putIntoVoucherWallet() {
		const voucher: VocherModel = {
			...this.transaction,
			exchange_status: ExchangeStatus.UNSUBMIT,
		};
		await this.voucherService.addVoucher(voucher);
		this.closeModal();
	}
	closeModal() {
		return this.viewCtrl.dismiss();
	}
}
