import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import {
	BlockServiceProvider,
	BlockModel,
} from "../../../providers/block-service/block-service";
import {TransactionModel} from "../../../providers/transaction-service/transaction-service";

@IonicPage({ name: "chain-block-detail" })
@Component({
	selector: "page-chain-block-detail",
	templateUrl: "chain-block-detail.html",
})
export class ChainBlockDetailPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public blockService: BlockServiceProvider,
	) {
		super(navCtrl, navParams, true, tabs);
	}
	block_info: BlockModel /* = {
		create_time: new Date(
			Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000,
		),
		address: "b7LA11Tgg3HNiAD6rJMDpD44y3V4WGNX8R",
		reward: 200 * Math.random(),
		height: (1000 * Math.random()) | 0,
		is_delay: Math.random() > 0.5,
		trans_num: (Math.random() * 5000) | 0,
		trans_assets: Math.random() * 10000,
		fee: 5000 * Math.random() * 0.00000001,
		tran_list: [],
	}*/;
	tran_list: TransactionModel[] = [];
	tran_list_config = {
		page: 1,
		pageSize: 20,
		has_more: true,
	};
	@ChainBlockDetailPage.willEnter
	initAndLoadData() {
		const block: BlockModel = this.navParams.get("block");
		if (!block) {
			return this.navCtrl.goToRoot({});
		}
		this.block_info = block;
		return this.loadTranLogs();
	}

	@asyncCtrlGenerator.error(() =>
		ChainBlockDetailPage.getTranslate("LOAD_MORE_TRANSACTION_LIST_ERROR"),
	)
	@asyncCtrlGenerator.loading(() =>
		ChainBlockDetailPage.getTranslate("LOAD_TRANSACTION_LIST_ERROR"),
	)
	async loadTranLogs() {
		const { block_info, tran_list_config } = this;
		// 重置page
		tran_list_config.page = 1;
		const transaction_list = await this.blockService.getTransactionsInBlock(
			block_info.id,
			tran_list_config.page,
			tran_list_config.pageSize,
		);
		tran_list_config.has_more =
			transaction_list.length === tran_list_config.pageSize;

		this.tran_list.push(...transaction_list);
	}

	@asyncCtrlGenerator.error(() =>
		ChainBlockDetailPage.getTranslate("LOAD_MORE_TRANSACTION_LIST_ERROR"),
	)
	async loadMoreTranLogs() {
		const { block_info, tran_list_config, tran_list } = this;

		tran_list_config.page += 1;
		const transaction_list = await this.blockService.getTransactionsInBlock(
			block_info.id,
			tran_list_config.page,
			tran_list_config.pageSize,
		);
		tran_list_config.has_more =
			transaction_list.length === tran_list_config.pageSize;
		this.tran_list.push(...transaction_list);
	}
}
