import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams, Refresher } from "ionic-angular";

@IonicPage({ name: "vote-delegate-detail" })
@Component({
	selector: "page-vote-delegate-detail",
	templateUrl: "vote-delegate-detail.html",
})
export class VoteDelegateDetailPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
	) {
		super(navCtrl, navParams, true, tabs);
	}
	delegate_info: any;
	@VoteDelegateDetailPage.willEnter
	async initData() {
		await new Promise(cb => setTimeout(cb, 1000));
		this.delegate_info = {
			username: "Gaubee",
			address: "aFJe90Uwc4SsmKI122fmKI122f90faOKJFES90faOKJFESIOe",
			get_vote_rate: Math.random() * 100,
		};
		await this.loadBlockList();
	}

	block_list: any[];
	block_list_config = {
		page: 1,
		pageSize: 20,
		has_more: false,
	};
	async loadBlockList(refresher?: Refresher) {
		await new Promise(cb => setTimeout(cb, 1000));
		const { block_list_config } = this;
		block_list_config.page = 1;
		block_list_config.has_more = true;

		this.block_list = Array.from(
			Array(block_list_config.pageSize),
		).map((_, i) => {
			return {
				create_time: new Date(Date.now() - (i + 1) * 3 * 128 * 1000),
				address: "b7LA11Tgg3HNiAD6rJMDpD44y3V4WGNX8R",
				reward: 200 * Math.random(),
				height: (1000 * Math.random()) | 0,
				is_delay: Math.random() > 0.5,
				trans_num: (Math.random() * 5000) | 0,
				trans_assets: Math.random() * 10000,
				fee: 5000 * Math.random() * 0.00000001,
				tran_logs: Array.from(Array((Math.random() * 100) | 0)),
				block_size: Math.random() * 10,
			};
		});
		if (refresher) {
			refresher.complete();
		}
	}

	async loadMoreBlockList() {
		await new Promise(cb => setTimeout(cb, 1000));
		const { block_list_config } = this;
		block_list_config.page += 1;

		this.block_list.push(
			...Array.from(Array(block_list_config.pageSize)).map((_, i) => {
				return {
					create_time: new Date(
						Date.now() - (i + 1) * 3 * 128 * 1000,
					),
					address: "b7LA11Tgg3HNiAD6rJMDpD44y3V4WGNX8R",
					reward: 200 * Math.random(),
					height: (1000 * Math.random()) | 0,
					is_delay: Math.random() > 0.5,
					trans_num: (Math.random() * 5000) | 0,
					trans_assets: Math.random() * 10000,
					fee: 5000 * Math.random() * 0.00000001,
					tran_logs: Array.from(Array((Math.random() * 100) | 0)),
					block_size: Math.random() * 10,
				};
			}),
		);
		block_list_config.has_more = this.block_list.length < 110;
		if (!block_list_config.has_more) {
			this.block_list.length = 110;
		}
	}
}
