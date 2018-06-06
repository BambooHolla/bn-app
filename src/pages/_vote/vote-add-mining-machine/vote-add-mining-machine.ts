import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { PromiseOut } from "../../../bnqkl-framework/PromiseExtends";
import { AppFetchProvider } from "../../../providers/app-fetch/app-fetch";
import { PeerServiceProvider } from "../../../providers/peer-service/peer-service";
import { TransactionServiceProvider } from "../../../providers/transaction-service/transaction-service";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { NetworkInterface } from "@ionic-native/network-interface";
import SocketIO from "socket.io-client";
window["SocketIO"] = SocketIO;
import {
	SystemRuntime,
	cpusStatus,
	ExtendsSystemRuntime,
	MiningMachine,
} from "../types";

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
		public peerService: PeerServiceProvider,
		public transactionService: TransactionServiceProvider,
	) {
		super(navCtrl, navParams, true, tabs);
	}
	peer_list: ExtendsSystemRuntime[] = [];
	selectPeer?: ExtendsSystemRuntime;
	peer_list_info = {
		loading: false,
	};
	doing_progress = {
		search_peer_list: false,
		fill_form: false,
	};
	search_lock?: PromiseOut<void>;
	@VoteAddMiningMachinePage.willEnter
	async searchPeerList() {
		console.log("this.search_lock", this.search_lock);
		if (this.search_lock) {
			return this.search_lock.promise;
		}
		this.search_lock = new PromiseOut();
		const ip = await this.networkInterface.getIPAddress().catch(err => {
			console.error(err);
			return "192.168.16.1";
		});
		const ipinfo = ip.split(".");
		const base_ip = ipinfo.slice(0, 3).join(".");
		const { peer_list_info, doing_progress } = this;
		doing_progress.search_peer_list = true;
		peer_list_info.loading = true;
		const tryIp = async (ip: string) => {
			const host = `http://${ip}`;

			const node = await PeerServiceProvider.fetchPeerPortInfo(
				ip,
				19003,
			).catch(() => null);
			if (!node) {
				return;
			}

			const peer_info = {
				webPort: node.webPort,
				port: 19003,
				ping: -1,
				ip,
			};
			this.addPeerList(peer_info);
		};
		try {
			this.peer_list = [];
			// 五条条来，避免阻塞
			const unit_progress_step = 1 / 255;
			this.search_progress = 0;
			this.is_stop_seach = false;
			const loopTryIp = async (i, delay) => {
				delay && (await new Promise(cb => setTimeout(cb, delay)));
				return tryIp(`${base_ip}.${i}`).then(() => {
					this.search_progress += unit_progress_step;
					if (this.search_progress > 1) {
						this.search_progress = 1;
					}
				});
			};
			for (var i = 1; i <= 255; i += 10) {
				if (this.is_stop_seach) {
					return;
				}
				if (this.is_pause_search) {
					await this.is_pause_search.promise;
				}
				await Promise.all([
					loopTryIp(i + 0, 0 * 100),
					loopTryIp(i + 1, 1 * 100),
					loopTryIp(i + 2, 2 * 100),
					loopTryIp(i + 3, 3 * 100),
					loopTryIp(i + 4, 4 * 100),
					loopTryIp(i + 5, 5 * 100),
					loopTryIp(i + 6, 6 * 100),
					loopTryIp(i + 7, 7 * 100),
					loopTryIp(i + 8, 8 * 100),
					loopTryIp(i + 9, 9 * 100),
				]);
			}
		} finally {
			this.peer_list_info.loading = false;
			// 释放控制器
			this.search_lock.resolve();
			this.search_lock = undefined;
		}
	}
	search_progress = 0;
	is_stop_seach = false;
	is_pause_search?: PromiseOut<void>;
	@VoteAddMiningMachinePage.didLeave
	stopSearch() {
		this.is_stop_seach = true;
	}

	loading_peer_info = false;
	private _dismiss_getPeerInfo_loading: any;

	private _getDelegateInfo(origin: string) {
		return this.appFetch
			.get<any>(`${origin}/api/system/SystemInfo`)
			.then(info => {
				return info.data.delegateInfo;
			});
	}
	private _getDelegateInfoAndFillForm(ip: string, port: number) {
		return this._getDelegateInfo(`http://${ip}:${port - 1}`).then(
			delegate => {
				if (delegate) {
					this.formData.publicKey = delegate.publicKey;
					this.formData.userName = delegate.userName;
				}
			},
		);
	}

	private _getPeerInfo_process: any;
	@asyncCtrlGenerator.loading("@@FETCHING_PEER_INFO", undefined, {
		showBackdrop: false,
		cssClass: "can-tap",
		dismiss_hanlder_name: "_dismiss_getPeerInfo_loading",
	})
	async getPeerInfo(peer: ExtendsSystemRuntime) {
		// 生成一个对象，用于到最后确保弹框的控制权还是属于当前处理函数
		const getPeerInfo_process = (this._getPeerInfo_process = {});
		const ip = peer.ip;
		this.formData.ip = peer.ip;
		this.formData.port = peer.port;
		this.formData.webPort = peer.webPort;
		const port = this.formData.port;
		const host = `http://${ip}`;
		// 使用websocket获取设备实时的硬件信息
		const wait_io = new PromiseOut<ExtendsSystemRuntime>();
		const socket = SocketIO(`${host}:${port}/systemInfo`, {
			transports: ["websocket"],
			reconnection: false,
		});
		// const ws = socket["ws"] as WebSocket;
		// ws.onerror = wait_io.reject;
		// window[`socket${ip}`] = socket;
		const start_time = Date.now();
		socket.on("error", err => {
			console.log("error", err);
			wait_io.reject(err);
		});
		socket.on("close", xx => {
			console.log("close", xx);
		});
		socket.on("connect", () => {
			const end_time = Date.now();
			peer.ping = end_time - start_time;
			wait_io.resolve(peer);
		});
		socket.on(
			"systemStatus",
			({ systemStatus: data }: { systemStatus }) => {
				this.formData.cpus = data.cpusStatus;
				this.cpu_simple_info = this.formData.cpus[0].model;
				this.formData.totalmen = data.memStatus.totalmem;
				if (data.cpusStatus.length > 12) {
					this.formData.hostname = "ARK Ⅱ";
				} else {
					this.formData.hostname = "ARK Ⅰ";
				}
				socket.close();
			},
		);
		socket.emit("systemStatus", {});
		this.loading_peer_info = true;

		// 使用 system/runtime 的接口获取设备的基本信息
		try {
			await Promise.all([
				wait_io.promise,
				this.appFetch
					.get<any>(`${host}:${port}/api/system/runtime`)
					.then(runtime => {
						// this.formData.hostname =
						// 	Math.random() > 0.5
						// 		? "ARK IFMChain Ⅰ"
						// 		: "ARK IFMChain Ⅱ";
						const platfrom = (this.formData.platform =
							runtime.data.System.platform);
						if (platfrom === "linux") {
							this.plaform_icon = "ifm-linux";
						} else if (platfrom === "darwin") {
							this.plaform_icon = "ifm-mac";
						} else if (platfrom === "win32") {
							this.plaform_icon = "ifm-windows";
						} else {
							this.plaform_icon = "ifm-unknown-system";
						}
					}),
				this._getDelegateInfoAndFillForm(ip, port),
			]);
		} catch (err) {
			this.goToSearchPeerListPage();
			if (
				// 如果还在当前配置节点页面
				this.doing_progress.fill_form &&
				getPeerInfo_process == this._getPeerInfo_process // 且这个getPeerInfo没有被二次进入
			) {
				await this.showErrorDialog(
					this.getTranslateSync("PEER_UNABLE"),
				);
				this.selectPeer = undefined;
				this.goToSearchPeerListPage();
			}
		} finally {
			this.loading_peer_info = false;
		}
	}

	async goToFillFormPage() {
		this.is_pause_search = new PromiseOut(); // 暂停搜索
		const { formData, doing_progress, selectPeer } = this;
		if (!selectPeer) {
			return;
		}
		doing_progress.fill_form = true; // 进入fill_form界面
		// 使用节点填充表单
		return this.getPeerInfo(selectPeer);
	}
	goToSearchPeerListPage() {
		if (this._dismiss_getPeerInfo_loading) {
			this._dismiss_getPeerInfo_loading();
		}
		this.is_pause_search && this.is_pause_search.resolve();
		this.doing_progress.fill_form = false; // 回到search_peer_list界面
	}
	customPeer = {
		port: "19003",
		ip: "",
	};
	is_custom_input_peer = false;
	customInputPeer() {
		this.is_custom_input_peer = !this.is_custom_input_peer;
	}
	/*添加自定义节点*/
	@asyncCtrlGenerator.loading()
	@asyncCtrlGenerator.error("@@ADD_CUSTOM_PEER_FAIL")
	async confirmCustomPeer() {
		const { ip, port } = this.customPeer;
		const formated_port = parseInt(port);
		if (
			!(
				formated_port > 0 &&
				formated_port < 65536 &&
				formated_port.toString() === port
			)
		) {
			return;
		}
		const formated_ip = ip.split(".");
		if (
			!(
				formated_ip.length === 4 &&
				formated_ip.every(ip_part => {
					const ip_part_num = parseInt(ip_part);
					return (
						ip_part_num >= 0 &&
						ip_part_num <= 255 &&
						ip_part_num.toString() === ip_part
					);
				})
			)
		) {
			return;
		}

		const web_port_info = await PeerServiceProvider.fetchPeerPortInfo(
			ip,
			formated_port,
		).catch(err =>
			Promise.reject(
				new Error(this.getTranslateSync("CUSTOM_PEER_IS_UNAVAILABLE")),
			),
		);

		const new_peer = {
			ping: -1,
			port: formated_port,
			ip,
			webPort: web_port_info.webPort,
		};

		this.addPeerList(new_peer, true);
	}
	addPeerList(new_peer: ExtendsSystemRuntime, insert_to_begin?: boolean) {
		if (
			this.peer_list.some(
				peer => peer.port === new_peer.port && peer.ip === new_peer.ip,
			)
		) {
			return;
		}
		if (insert_to_begin) {
			this.peer_list.unshift(new_peer);
		} else {
			this.peer_list.push(new_peer);
		}
	}

	plaform_icon = "";
	cpu_simple_info = "";
	formData: MiningMachine = {
		platform: "",
		hostname: "",
		cpus: [] as cpusStatus,
		totalmen: 0,
		ip: "",
		port: 0,
		webPort: 0,
		publicKey: "",
		userName: "",
		delegate_pwd: "",
	};
	getPeerDetail() {}
	@asyncCtrlGenerator.error("@@ADD_MINING_MACHINE_FAIL")
	/*确定添加委托人*/
	async confirmAddMachine() {
		const { formData } = this;
		/// 校验
		if (formData.publicKey) {
			const keypair = this.transactionService.keypairService.create(
				formData.delegate_pwd,
			);
			if (formData.publicKey !== keypair.publicKey.toString("hex")) {
				// 这台设备已经存在了，校验公钥是否匹配
				throw new Error(
					this.getTranslateSync(
						"THE_DELEGATE'S_PASSPHRASE_DOES_NOT_MATCH_THE_EXISTING_PUBLICKEY",
					),
				);
			}
		} else {
			this.peerService
				.oneTimeUrl(
					this.peerService.FORGING_ENABLE,
					`http://${formData.ip}:${formData.webPort}`,
				)
				// 设置委托人
				.setDelegateToMiningMachine(formData.delegate_pwd);
			await this._getDelegateInfoAndFillForm(formData.ip, formData.port);

			// // 回头重新校验
			// return this.confirmAddMachine();
		}

		/// 校验通过
		let { my_mining_machine } = this.appSetting.settings;
		const new_mac = this.formData;
		// 去重使用当前配置作为最新
		my_mining_machine = my_mining_machine.filter(
			mac => !(mac.ip === new_mac.ip && mac.port === new_mac.port),
		);
		my_mining_machine.unshift(new_mac);
		this.appSetting.settings.my_mining_machine = my_mining_machine;
		this.finishJob(true);
	}
}
