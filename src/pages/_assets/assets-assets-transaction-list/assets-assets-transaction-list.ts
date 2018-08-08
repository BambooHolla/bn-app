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

	transaction_list: TransactionModel[] = [];
	page_info = {
		page: 0,
		pageSize: 20,
		hasMore: true,
		loading: false,
	};

	assets_info?: AssetsModelWithLogoSafeUrl;

	@AssetsAssetsTransactionListPage.willEnter
	initData() {
		const assets_info = this.navParams.get("assets");
		if (!assets_info) {
			return this.navCtrl.goToRoot({});
		}
		this.assets_info = assets_info;
	}

	@asyncCtrlGenerator.error()
	private _loadAssetsTransactionList() {}
}
