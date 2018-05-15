import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";

@IonicPage({ name: "vote-add-mining-machine" })
@Component({
	selector: "page-vote-add-mining-machine",
	templateUrl: "vote-add-mining-machine.html",
})
export class VoteAddMiningMachinePage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
	) {
		super(navCtrl, navParams, true, tabs);
	}
	peer_list: any[] = [];
	selectPeer: any = null;
	peer_list_info = {
		loading: false,
	};
	doing_progress = {
		search_peer_list: false,
		fill_form: false,
	};
	@VoteAddMiningMachinePage.willEnter
	async searchPeerList() {
		const { peer_list_info, doing_progress } = this;
		doing_progress.search_peer_list = true;
		peer_list_info.loading = true;
		try {
			this.peer_list = [];
			await Promise.all(
				Array.from({ length: (5 + 10 * Math.random()) | 0 }, (_, i) => {
					const ping = Math.random() * 1000;

					return new Promise(cb => {
						setTimeout(() => {
							this.peer_list.push({
								ip: `192.168.0.${(6 + 250 * Math.random()) |
									0}`,
								ping,
							});
							cb();
						}, ping);
					});
				}),
			);
		} finally {
			this.peer_list_info.loading = false;
		}
	}
	goToFillFormPage() {
		const { formData, doing_progress, selectPeer } = this;
		doing_progress.fill_form = true;
		formData.ip = selectPeer.ip;
		if (formData.platform === "linux") {
			this.plaform_icon = "ifm-linux";
		} else if (formData.platform === "darwin") {
			this.plaform_icon = "ifm-mac";
		} else if (formData.platform === "win32") {
			this.plaform_icon = "ifm-windows";
		} else {
			this.plaform_icon = "ifm-unknown-system";
		}
		this.cpu_simple_info = this.formData.cpus[0].model;
	}

	plaform_icon = "";
	cpu_simple_info = "";
	formData = {
		platform: "linux",
		hostname: "Gaubee7's personal PC",
		cpus: Array(4).fill({
			model: "Intel(R) Core(TM) i5-7200U CPU @ 2.50GHz",
		}),
		totalmen: 12759629824,
		ip: "",
		port: 19002,
		delegate_pwd: "",
	};
	async confirmAddMachine() {
		const { my_mining_machine } = this.appSetting.settings;
		my_mining_machine.push(this.formData);
		this.appSetting.settings.my_mining_machine = my_mining_machine;
		this.finishJob(true);
	}
}
