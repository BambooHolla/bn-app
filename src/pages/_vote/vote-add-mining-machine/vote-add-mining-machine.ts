import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { AppFetchProvider } from "../../../providers/app-fetch/app-fetch";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { NetworkInterface } from "@ionic-native/network-interface";
import SocketIO from "socket.io-client";

interface SystemRuntime {
	Transactions: {
		count: number;
		u_count: number;
	};
	System: {
		memory: {
			rss: number;
			heapTotal: number;
			heapUsed: number;
			external: number;
		};
		platform: string;
		cpuCount: number;
		freemem: number;
		cpuUsage: number;
	};
}
interface ExtendsSystemRuntime extends SystemRuntime {
	ip: string;
	ping: number;
	port: number;
}

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
		public networkInterface: NetworkInterface,
		public appFetch: AppFetchProvider,
	) {
		super(navCtrl, navParams, true, tabs);
	}
	peer_list: ExtendsSystemRuntime[] = [];
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
		const ip = await this.networkInterface.getIPAddress().catch(err => {
			console.error(err);
			return "192.168.16.1";
		});
		const ipinfo = ip.split(".");
		const base_ip = ipinfo.slice(0, 3).join(".");
		const { peer_list_info, doing_progress } = this;
		doing_progress.search_peer_list = true;
		peer_list_info.loading = true;
		try {
			this.peer_list = [];
			await Promise.all(
				Array.from({ length: 255 }, async (_, i) => {
					const cur_ip = `http://${base_ip}.${i + 1}`;
					const fetchApi = (port: number) =>
						this.appFetch
							.get<SystemRuntime>(
								`${cur_ip}:${port}/api/system/runtime`,
							)
							.then(res => ({ ...res, port, ip: cur_ip }));

					const node = await Promise.race([
						fetchApi(19000),
						fetchApi(19002),
					]).catch(() => null);
					if (!node) {
						return;
					}
					const peer_info = {
						...node,
						ping: -1,
					};
					this.peer_list.push(peer_info);
					await new Promise<ExtendsSystemRuntime>(
						(resolve, reject) => {
							const io = SocketIO(`${cur_ip}:19003/systeminfo`, {
								transports: ["websocket"],
							});
							const start_time = Date.now();
							io.on("connect", () => {
								const end_time = Date.now();

								peer_info.ping = end_time - start_time;
							});
							io.on("systemStatus", data => {
								console.log(data);
							});
							io.emit("systemStatus", {});
						},
					);
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
