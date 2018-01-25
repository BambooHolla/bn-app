import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams, Refresher } from "ionic-angular";

@IonicPage({ name: "vote-income-logs" })
@Component({
	selector: "page-vote-income-logs",
	templateUrl: "vote-income-logs.html",
})
export class VoteIncomeLogsPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
	) {
		super(navCtrl, navParams, true, tabs);
		this.auto_header_shadow_when_scroll_down = true;
	}

	income_log_list: any[];
	income_log_list_config = {
		page: 0,
		pageSize: 20,
		has_more: true,
	};
	@VoteIncomeLogsPage.willEnter
	async loadIncomeLogList(refresher?: Refresher) {
		await new Promise(cb => setTimeout(cb, 1000));
		const { income_log_list_config } = this;
		// 重置分页
		income_log_list_config.page = 0;
		this.income_log_list = Array.from(
			Array(income_log_list_config.pageSize),
		).map(() => ({ create_time: new Date() }));
		if (refresher) {
			refresher.complete();
		}
	}
	async loadMoreIncomeLogList() {
		await new Promise(cb => setTimeout(cb, 1000));
		const { income_log_list_config } = this;
		// 重置分页
		income_log_list_config.page += 0;
		this.income_log_list.push(
			...Array.from(Array(income_log_list_config.pageSize)).map(() => ({
				create_time: new Date(),
			})),
		);
		income_log_list_config.has_more = this.income_log_list.length < 110;
		if (!income_log_list_config.has_more) {
			this.income_log_list.length = 110;
		}
	}
}
