import {
	ViewChild,
	Component,
	Optional,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
} from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import {
	BlockServiceProvider,
	BlockModel,
	SingleBlockModel,
} from "../../../providers/block-service/block-service";
import {
	TransactionModel,
	TransactionTypes,
} from "../../../providers/transaction-service/transaction-service";
import { BytesPipe } from "../../../pipes/bytes/bytes";
import {
	SyncProgressSpinnerComponent,
	ProgressSpinner,
} from "../../../components/sync-progress-spinner/sync-progress-spinner";

@IonicPage({ name: "chain-sync-detail" })
@Component({
	selector: "page-chain-sync-detail",
	templateUrl: "chain-sync-detail.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChainSyncDetailPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public blockService: BlockServiceProvider,
		public cdRef: ChangeDetectorRef,
	) {
		super(navCtrl, navParams, true, tabs);
	}
	/**页面变量的定义*/
	// 第一次同步时间
	sync_start_time = new Date(0);
	// 区块高度
	block_height = 0;
	// 同步使用的流量
	sync_data_flow_info = { value: "0", unit: "KB" };
	// 总进度
	get general_progress() {
		var denominator = 0;
		var molecular = 0;
		if (this.enable_sync_progress_blocks) {
			denominator += 100;
			molecular += this.sync_progress_blocks;
		}
		if (this.enable_sync_progress_transactions) {
			denominator += 100;
			molecular += this.sync_progress_transactions;
		}
		if (this.enable_sync_progress_equitys) {
			denominator += 100;
			molecular += this.sync_progress_equitys;
		}

		return this.toFixed(
			(denominator ? molecular / denominator : 0) * 100,
			0,
			2,
		);
	}

	@ViewChild(SyncProgressSpinnerComponent)
	syncProgressSpinner?: SyncProgressSpinnerComponent;
	//同步区块 的进度
	sync_progress_blocks = 0;
	enable_sync_progress_blocks = false;
	//同步交易 的进度
	sync_progress_transactions = 0;
	enable_sync_progress_transactions = false;
	//同步权益 的进度
	sync_progress_equitys = 0;
	enable_sync_progress_equitys = false;

	/**动态监听变量的变动*/

	@ChainSyncDetailPage.willEnter
	initBindSyncStartTime() {
		this.sync_start_time = new Date(
			this.appSetting.settings.sync_start_time,
		);
		this.markForCheck();
	}
	@ChainSyncDetailPage.onInit
	initBindContributionTraffic() {
		const on_sync_data_flow_changed = sync_data_flow => {
			const info = BytesPipe.transform(sync_data_flow, 2);
			if (typeof info === "string" && info.indexOf(" ") !== -1) {
				const [value, unit] = info.split(" ");
				this.sync_data_flow_info.value = value;
				this.sync_data_flow_info.unit = unit;
			} else {
				this.sync_data_flow_info.value = "???";
				this.sync_data_flow_info.unit = "KB";
			}
			this.markForCheck();
		};
		this.registerViewEvent(
			this.appSetting,
			"changed@setting.sync_data_flow",
			on_sync_data_flow_changed,
		);
		on_sync_data_flow_changed(
			this.appSetting.settings.sync_data_flow,
		);
	}

	@ChainSyncDetailPage.addEvent("HEIGHT:CHANGED")
	initBindBlockHeight() {
		this.block_height = this.appSetting.getHeight();
		this.markForCheck();
	}

	@ChainSyncDetailPage.onInit
	initBindSyncProgress() {
		[
			"sync_progress_blocks",
			"sync_progress_transactions",
			"sync_progress_equitys",
		].forEach((k, i) => {
			let ps: ProgressSpinner | undefined;
			{
				// 重写getter/setter
				const private_k = Symbol(k);
				this[private_k] = this[k];
				Object.defineProperty(this, k, {
					get: () => this[private_k],
					set: v => {
						this[private_k] = v;
						this.cdRef.markForCheck();
						if (ps) {
							// 如果进度倒退了，就快速显示成小的进度，避免出现倒退的问题
							const old_progress = ps.progress;
							const new_progress = v / 100;
							ps.setProgress(
								v / 100,
								old_progress > new_progress ? 0 : 1000,
							);
						}
						if (!ps) {
							ps =
								this.syncProgressSpinner &&
								this.syncProgressSpinner.getPS(i);
							if (ps) {
								// 第一次，默认没有动画，除非是被禁用的
								ps.setProgress(
									v / 100,
									this[enable_k] ? 0 : 1000,
								);
							}
						}
					},
				});
			}

			const on_sync_progress_changed = progress => {
				this[k] = progress;
			};
			this.registerViewEvent(
				this.appSetting,
				"changed@setting." + k,
				on_sync_progress_changed,
			);
			on_sync_progress_changed(this.appSetting.settings[k]);

			/**是否禁用*/

			const enable_k = "enable_" + k;
			{
				// 重写getter/setter
				const private_enable_k = Symbol(enable_k);
				this[private_enable_k] = this[enable_k];
				Object.defineProperty(this, enable_k, {
					get: () => this[private_enable_k],
					set: v => {
						this[private_enable_k] = v;
						this.cdRef.markForCheck();
						if (!ps) {
							ps =
								this.syncProgressSpinner &&
								this.syncProgressSpinner.getPS(i);
						}
						if (ps) {
							ps.setDisabled(!v);
						}
					},
				});
			}
			const on_enable_sync_progress_changed = is_enabled => {
				this[enable_k] = is_enabled;
			};
			this.registerViewEvent(
				this.appSetting,
				"changed@setting." + enable_k,
				on_enable_sync_progress_changed,
			);
			on_enable_sync_progress_changed(this.appSetting.settings[enable_k]);
		});
	}
	@ChainSyncDetailPage.didEnter
	bindSyncProgress() {
		this.enable_sync_progress_blocks = this.enable_sync_progress_blocks;
		this.enable_sync_progress_transactions = this.enable_sync_progress_transactions;
		this.enable_sync_progress_equitys = this.enable_sync_progress_equitys;
		this.sync_progress_blocks = this.sync_progress_blocks;
		this.sync_progress_transactions = this.sync_progress_transactions;
		this.sync_progress_equitys = this.sync_progress_equitys;
	}

	syncInBackground() {
		this.finishJob(true);
	}
}
