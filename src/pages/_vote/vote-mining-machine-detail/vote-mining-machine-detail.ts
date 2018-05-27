import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { PromiseOut } from "../../../bnqkl-framework/PromiseExtends";
import { AppFetchProvider } from "../../../providers/app-fetch/app-fetch";
import { PeerServiceProvider } from "../../../providers/peer-service/peer-service";
import { TransactionServiceProvider } from "../../../providers/transaction-service/transaction-service";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { MiningMachine } from "../types";
import { listenCpuUsage } from "../vote-list/vote-list";

@IonicPage({ name: "vote-mining-machine-detail" })
@Component({
	selector: "page-vote-mining-machine-detail",
	templateUrl: "vote-mining-machine-detail.html",
})
export class VoteMiningMachineDetailPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
	) {
		super(navCtrl, navParams, true, tabs);
	}
	mac!: MiningMachine & {
		cpu_usage: number;
		connected: boolean;
	};
	deleteMac() {
		this.showConfirmDialog(
			this.getTranslateSync("CONFIRM_TO_DELETE_THIS_MACHINE"),
			() => {
				const { mac } = this;
				this.appSetting.settings.my_mining_machine = this.appSetting.settings.my_mining_machine.filter(
					mac => mac.ip === mac.ip && mac.port === mac.port,
				);
				this.finishJob(true);
			},
		);
	}
	@VoteMiningMachineDetailPage.willEnter
	initData() {
		const mining_machine = this.navParams.get("mac");
		if (!mining_machine) {
			return this.navCtrl.goToRoot({});
		}
		this.mac = { ...mining_machine };// 复制一份
		const socket = listenCpuUsage(this.mac, usage => {
			this.mac.cpu_usage = usage;
		});
		this.mac.connected = false;
		socket.on("connect", () => {
			this.mac.connected = true;
		});
		socket.on("disconnect", () => {
			this.mac.connected = false;
		});
	}
}
