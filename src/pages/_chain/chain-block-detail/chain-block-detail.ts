import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";

/**
 * Generated class for the ChainBlockDetailPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

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
	) {
		super(navCtrl, navParams, true, tabs);
	}
	block_info = {
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
		tran_logs: [],
	};
	tran_logs_config = {
		page: 1,
		pageSize: 20,
		has_more: true,
	};
	@ChainBlockDetailPage.willEnter
	async loadTranLogs() {
		await new Promise(cb => setTimeout(cb, 1000));
		this.block_info.tran_logs.push(
			...Array.from(Array(this.tran_logs_config.pageSize)),
		);
	}

	async loadMoreTranLogs() {
		await new Promise(cb => setTimeout(cb, 1000));
		if (this.block_info.tran_logs.length < 110) {
			this.block_info.tran_logs.length += this.tran_logs_config.pageSize;
		}
		if (this.block_info.tran_logs.length >= 110) {
			this.block_info.tran_logs.length = 110;
			this.tran_logs_config.has_more = false;
		}
	}
}
