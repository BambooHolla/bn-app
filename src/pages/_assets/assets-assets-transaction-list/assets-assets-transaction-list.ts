import {
	ViewChild,
	Component,
	Optional,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
} from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { sleep } from "../../../bnqkl-framework/PromiseExtends";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import {
	IonicPage,
	NavController,
	NavParams,
	ViewController,
} from "ionic-angular";
import {
	AssetsServiceProvider,
	AssetsModel,
	AssetsModelWithLogoSafeUrl,
} from "../../../providers/assets-service/assets-service";
import {
	TransactionServiceProvider,
	TransactionModel,
} from "../../../providers/transaction-service/transaction-service";
import {
	LocalContactProvider,
	LocalContactModel,
} from "../../../providers/local-contact/local-contact";

@IonicPage({ name: "assets-assets-transaction-list" })
@Component({
	selector: "page-assets-assets-transaction-list",
	templateUrl: "assets-assets-transaction-list.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetsAssetsTransactionListPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public cdRef: ChangeDetectorRef,
		public viewCtrl: ViewController,
		public assetsService: AssetsServiceProvider,
		public transactionService: TransactionServiceProvider,
		public localContact: LocalContactProvider
	) {
		super(navCtrl, navParams, true, tabs);
	}

	@AssetsAssetsTransactionListPage.markForCheck
	transaction_list: TransactionModel[] = [];
	page_info = {
		page: 0,
		pageSize: 20,
		hasMore: true,
		loading: false,
	};

	@AssetsAssetsTransactionListPage.markForCheck
	assets_info?: AssetsModelWithLogoSafeUrl;

	@AssetsAssetsTransactionListPage.willEnter
	initData() {
		if (this._is_from_child) {
			this._is_from_child = false;
			this._updateTrsListNickName();
			return;
		}
		const assets_info = this.navParams.get("assets");
		if (!assets_info) {
			return this.navCtrl.goToRoot({});
		}
		this.assets_info = assets_info;

		this.initAssetsTransactionList();
	}

	/*初始化列表*/
	@asyncCtrlGenerator.error()
	async initAssetsTransactionList() {
		const { page_info } = this;
		page_info.page = 1;
		this.transaction_list = await this._loadAssetsTransactionList();
	}
	@asyncCtrlGenerator.error()
	async loadMoreAssetsTransactionList() {
		const { page_info } = this;
		page_info.page += 1;
		this.transaction_list.push(
			...(await this._loadAssetsTransactionList())
		);
	}

	private _loadAssetsTransactionList() {
		const { page_info, assets_info } = this;
		if (!assets_info) {
			return [];
		}

		return this.transactionService
			.queryTransactionsByPages(
				{
					type: this.transactionService.TransactionTypes
						.TRANSFER_ASSET,
					assetType: assets_info.abbreviation,
				},
				{ timestamp: -1 },
				page_info.page,
				page_info.pageSize
			)
			.then(tra_list =>
				this.localContact.formatTransactionWithLoclContactNickname(
					tra_list
				)
			);
	}
	private _updateTrsListNickName() {
		this.localContact
			.formatTransactionWithLoclContactNickname(this.transaction_list)
			.then(trs_list => (this.transaction_list = trs_list));
	}

	private _is_from_child = false;
	routeToAssetsTransaction(transaction: TransactionModel) {
		this._is_from_child = true;
		this.routeTo("chain-transaction-detail", { transaction });
	}
}
