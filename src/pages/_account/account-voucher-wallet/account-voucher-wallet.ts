import {
	Component,
	Optional,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
} from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import {
	IonicPage,
	NavController,
	NavParams,
	ViewController,
} from "ionic-angular";
import {
	VoucherServiceProvider,
	VocherModel,
	ExchangeStatus,
} from "../../../providers/voucher-service/voucher-service";
import {
	TransactionServiceProvider,
	TransactionModel,
} from "../../../providers/transaction-service/transaction-service";

@IonicPage({ name: "account-voucher-wallet" })
@Component({
	selector: "page-account-voucher-wallet",
	templateUrl: "account-voucher-wallet.html",
})
export class AccountVoucherWalletPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public viewCtrl: ViewController,
		public voucherService: VoucherServiceProvider,
		public transactionService: TransactionServiceProvider,
	) {
		super(navCtrl, navParams, true, tabs);
	}
	page_info = {
		offset: 0,
		limit: 20,
		hasMore: false,
		loading: false,
	};
	voucher_list: VocherModel[] = [];

	@AccountVoucherWalletPage.willEnter
	@asyncCtrlGenerator.error()
	async loadData() {
		// this.voucherService.
		this.page_info.offset = 0;
		const list = await this._getVoucherList();
		this.voucher_list = list;
	}
	@asyncCtrlGenerator.error()
	async loadMoreData() {
		// this.voucherService.
		const list = await this._getVoucherList();
		this.voucher_list.push(...list);
	}

	private async _getVoucherList() {
		const { page_info } = this;
		try {
			page_info.loading = true;

			const list = await this.voucherService.getVoucherListByOffset(
				page_info.offset,
				page_info.limit,
				true,
			);
			page_info.hasMore = list.length === page_info.offset;
			page_info.offset += list.length;
			return list;
		} finally {
			page_info.loading = false;
		}
	}
	@asyncCtrlGenerator.error()
	private async removeVoucherItem(tran: VocherModel) {
		if (await this.voucherService.removeVoucher(tran.id)) {
			const index = this.voucher_list.indexOf(tran);
			if (index !== -1) {
				this.voucher_list.splice(index, 1);
			}
		}
	}

	@asyncCtrlGenerator.error()
	async submitTransaction(vocher: VocherModel) {
		const { exchange_status, ...tran } = vocher;
		await this.transactionService.putThirdTransaction(
			tran as TransactionModel,
		);
		vocher.exchange_status = ExchangeStatus.SUBMITED;
		this.voucherService.updateVoucher(vocher);
	}
	// 检测交易是否被打进块了
	@AccountVoucherWalletPage.addEvent("HEIGHT:CHANGED")
	async updateListExchangeStatus() {
		for (var _tran of this.voucher_list) {
			const tran = _tran;
			if (tran.exchange_status === ExchangeStatus.CONFIRMED) {
				return;
			}
			const block_tran = await this.transactionService
				.getTransactionById(_tran.id)
				.catch(() => null);
			if (block_tran) {
				tran.exchange_status = ExchangeStatus.CONFIRMED;
				this.voucherService.updateVoucher(tran);
			}
		}
	}

	submitVoucher(tran: VocherModel) {
		if (tran.exchange_status !== ExchangeStatus.UNSUBMIT) {
			return;
		}
		this.actionSheetCtrl
			.create({
				title: this.getTranslateSync("CONFIRM_TO_SUBMIT_THIS_VOUCHER"),
				buttons: [
					{
						// cssClass: "clip-text common-gradient",
						text: this.getTranslateSync("CONFIRM_SUBMIT_VOUCHER"),
						handler: () => {
							this.submitTransaction(tran);
						},
					},
					{
						text: this.getTranslateSync("CANCEL"),
						role: "cancel",
					},
				],
			})
			.present();
	}

	confirmToDelete(tran: VocherModel) {
		this.actionSheetCtrl
			.create({
				title: this.getTranslateSync("CONFIRM_TO_DELETE_THIS_VOUCHER"),
				buttons: [
					{
						text: this.getTranslateSync("CONFIRM_DELETE"),
						role: "destructive",
						handler: () => {
							this.removeVoucherItem(tran);
						},
					},
					{
						text: this.getTranslateSync("CANCEL"),
						role: "cancel",
					},
				],
			})
			.present();
	}
}
