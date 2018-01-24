import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams, Refresher } from "ionic-angular";
import {
	TransferProvider,
	ReceiveLogModel,
} from "../../../providers/transfer/transfer";

@IonicPage({ name: "pay-receive" })
@Component({
	selector: "page-pay-receive",
	templateUrl: "pay-receive.html",
})
export class PayReceivePage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		public transferProvider: TransferProvider,
		@Optional() public tabs: TabsPage,
	) {
		super(navCtrl, navParams, true, tabs);
	}
	account_info = {
		username: "吴祖贤",
		address: "b7LA11Tgg3HNiAD6rJMDpD44y3V4WGNX8R",
	};
	receive_logs: ReceiveLogModel[];
	receive_config = {
		has_more: true,
		num: 20,
		from: new Date(),
	};

	@PayReceivePage.willEnter
	async loadReceiveLogs(refresher?: Refresher) {
		const receive_logs = await this.transferProvider.getReceiveLogList(
			this.receive_config.num,
			this.receive_config.from,
		);
		const last_log = receive_logs[receive_logs.length - 1];
		if (last_log) {
			this.receive_config.from = last_log.create_time;
		}
		this.receive_config.has_more =
			receive_logs.length == this.receive_config.num;

		this.receive_logs = receive_logs;
		if (refresher) {
			refresher.complete();
		}
	}

	async loadMoreReceiveLogs() {
		await new Promise(cb => setTimeout(cb, Math.random() * 3000));
		const receive_logs = await this.transferProvider.getReceiveLogList(
			this.receive_config.num,
			this.receive_config.from,
		);
		this.receive_logs.push(...receive_logs);
	}
}
