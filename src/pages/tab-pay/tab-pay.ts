import { Component } from "@angular/core";
import {
	IonicPage,
	NavController,
	NavParams,
	Refresher,
	InfiniteScroll,
} from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import {
	TransferProvider,
	RollOutLogModel,
} from "../../providers/transfer/transfer";

function generateRollOutLog(len = 20, from = Date.now()) {
	return Array.from(Array(len)).map(_ => {
		return {};
	});
}

@IonicPage({ name: "tab-pay" })
@Component({
	selector: "page-tab-pay",
	templateUrl: "tab-pay.html",
})
export class TabPayPage extends FirstLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		public transferProvider: TransferProvider,
	) {
		super(navCtrl, navParams);
	}
	roll_out_logs: RollOutLogModel[];
	roll_out_config = {
		has_more: true,
		num: 20,
		from: new Date(),
	};

	@TabPayPage.willEnter
	async loadRollOutLogs(refresher?: Refresher) {
		const roll_out_logs = await this.transferProvider.getRollOutLogList(
			this.roll_out_config.num,
			this.roll_out_config.from,
		);
		const last_log = roll_out_logs[roll_out_logs.length - 1];
		if (last_log) {
			this.roll_out_config.from = last_log.create_time;
		}
		this.roll_out_config.has_more =
			roll_out_logs.length == this.roll_out_config.num;

		this.roll_out_logs = roll_out_logs;
		if (refresher) {
			refresher.complete();
		}
	}

	async loadMoreRollOutLogs() {
		await new Promise(cb => setTimeout(cb, Math.random() * 3000));
		const roll_out_logs = await this.transferProvider.getRollOutLogList(
			this.roll_out_config.num,
			this.roll_out_config.from,
		);
		this.roll_out_logs.push(...roll_out_logs);
	}
}
