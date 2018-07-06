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
import {
	IonicPage,
	NavController,
	NavParams,
	ViewController,
} from "ionic-angular";
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
import { TimestampPipe } from "../../../pipes/timestamp/timestamp";

const TIMESPAN_MULTIPLE = {
	year: 365 * 24 * 60 * 60 * 1000,
	month: 30 * 24 * 60 * 60 * 1000,
	day: 24 * 60 * 60 * 1000,
	hour: 60 * 60 * 1000,
	minute: 60 * 1000,
	second: 1000,
	millisecond: 1,
};

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
		public viewCtrl: ViewController,
	) {
		super(navCtrl, navParams, true, tabs);
	}
	/**页面变量的定义*/
	// 目前同步的连续区块的最低高度与最高高度的时间差
	sync_delay_time: { value: string; unit: string }[] = [];
	delay_ms = -1;
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
	@ChainSyncDetailPage.onInit
	initBindSyncProgressHeight() {
		let lock;
		const on_sync_progress_height_changed = async () => {
			if (lock) {
				return;
			}
			lock = true;
			const cur_height = this.appSetting.getHeight();
			const { sync_progress_height } = this.appSetting.settings;
			if (cur_height <= sync_progress_height) {
				this.sync_delay_time = [];
				this.delay_ms = 0;
				this.markForCheck();
				lock = false;
				// // 区块链完整后自动关闭界面
				// this.syncInBackground();
				return;
			}

			const [cur_block, process_block] = await Promise.all([
				this.blockService.getBlockByHeight(cur_height),
				this.blockService.getBlockByHeight(sync_progress_height),
			]);
			const cur_time = TimestampPipe.transform(cur_block.timestamp);
			const process_time = TimestampPipe.transform(
				process_block.timestamp,
			);

			const time_keys = [
				"year",
				"month",
				"day",
				"hour",
				"minute",
				"second",
				// "millisecond",
			];

			this.sync_delay_time = [];
			let is_start_col = false;
			let diff_timespan = cur_time.valueOf() - process_time.valueOf();
			this.delay_ms = diff_timespan;
			for (var time_key of time_keys) {
				time_keys[time_key];
				const val = Math.floor(
					diff_timespan / TIMESPAN_MULTIPLE[time_key],
				);
				diff_timespan -= val * TIMESPAN_MULTIPLE[time_key];
				if (val) {
					is_start_col = true;
				}
				if (is_start_col) {
					this.sync_delay_time.push({
						value: this.toFixed(val, 0, 2),
						unit: "UNIT_" + time_key,
					});
				}
				if (this.sync_delay_time.length >= 3) {
					break;
				}
			}

			this.markForCheck();
			lock = false;
		};
		this.registerViewEvent(
			this.appSetting,
			"changed@setting.sync_progress_height",
			on_sync_progress_height_changed,
		);
		this.registerViewEvent(
			this.appSetting,
			"HEIGHT:CHANGED",
			on_sync_progress_height_changed,
		);
		on_sync_progress_height_changed();
	}

	@ChainSyncDetailPage.onInit
	initBindContributionTraffic() {
		const on_sync_data_flow_changed = sync_data_flow => {
			const info = BytesPipe.transform(sync_data_flow, 2);
			if (typeof info === "string" && info.indexOf(" ") !== -1) {
				const [value, unit] = info.split(" ");
				this.sync_data_flow_info.value = parseFloat(value).toFixed(2);
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
		on_sync_data_flow_changed(this.appSetting.settings.sync_data_flow);
	}

	@ChainSyncDetailPage.addEvent("HEIGHT:CHANGED")
	initBindBlockHeight() {
		this.block_height = this.appSetting.getHeight();
		this.markForCheck();
	}
	/*TODO，对时间进行计算*/
	private _calcSyncDelayTime() {
		this.blockService;
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
		this.finishJob(true, 10);
	}
}
