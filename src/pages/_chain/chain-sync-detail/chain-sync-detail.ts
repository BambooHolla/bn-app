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
	// 加载区块的数据，如果可能要卡很久，因为区块1可能也是卡死的
	is_calcing_delay_time = true;
	sync_progress_height = this.appSetting.share_settings.sync_progress_height;
	delay_ms = -1;
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
	sync_is_verifying_block = false;
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
		this.registerViewEvent(
			this.appSetting,
			"changed@share_settings.sync_is_verifying_block",
			() => {
				this.sync_is_verifying_block = this.appSetting.share_settings.sync_is_verifying_block;
				this.markForCheck();
			},
			true,
		);
		const clear_sync_delay_time = () => {
			this.is_calcing_delay_time = false;
			this.sync_delay_time = [];
		};
		const on_sync_progress_height_changed = async () => {
			if (this.appSetting.share_settings.sync_is_verifying_block) {
				return;
			}
			const finished = () => {
				this.markForCheck();
			};
			const cur_height = this.appSetting.getHeight();
			const { sync_progress_height } = this.appSetting.share_settings;
			this.sync_progress_height = sync_progress_height;
			if (cur_height <= sync_progress_height) {
				clear_sync_delay_time();
				this.delay_ms = 0;
				finished();
				// 区块链完整后自动关闭界面
				this.syncInBackground();
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

			clear_sync_delay_time();
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

			finished();
		};
		this.registerViewEvent(
			this.appSetting,
			"changed@share_settings.sync_progress_height",
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
		this.registerViewEvent(
			this.appSetting,
			"changed@share_settings.sync_data_flow",
			() => {
				const info = BytesPipe.transform(
					this.appSetting.share_settings.sync_data_flow,
					2,
				);
				if (typeof info === "string" && info.indexOf(" ") !== -1) {
					const [value, unit] = info.split(" ");
					this.sync_data_flow_info.value = parseFloat(value).toFixed(
						2,
					);
					this.sync_data_flow_info.unit = unit;
				} else {
					this.sync_data_flow_info.value = "???";
					this.sync_data_flow_info.unit = "KB";
				}
				this.markForCheck();
			},
			true,
		);
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
			this.registerViewEvent(
				this.appSetting,
				"changed@share_settings." + k,
				() => {
					this[k] = this.appSetting.share_settings[k];
				},
				true,
			);

			const enable_k = "enable_" + k;
			this.registerViewEvent(
				this.appSetting,
				"changed@share_settings." + enable_k,
				() => {
					this[enable_k] = this.appSetting.share_settings[enable_k];
				},
				true,
			);
		});
	}

	bindPSWithSyncProgressAfterEnter() {
		[
			"sync_progress_blocks",
			"sync_progress_transactions",
			"sync_progress_equitys",
		].forEach((k, i) => {
			const ps = this.syncProgressSpinner!.getPS(i);
			{
				// 重写getter/setter
				const private_k = Symbol(k);
				this[private_k] = this[k];
				Object.defineProperty(this, k, {
					get: () => this[private_k],
					set: v => {
						this[private_k] = v;
						this.cdRef.markForCheck();

						// 如果进度倒退了，就快速显示成小的进度，避免出现倒退的问题
						const old_progress = ps.progress;
						const new_progress = v / 100;
						ps.setProgress(v / 100, 500);
					},
				});
			}

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

						ps.setDisabled(!v);
					},
				});
			}
		});
	}
	@ChainSyncDetailPage.didEnter
	async bindSyncProgress() {
		const ani_init = i => {
			return new Promise(resolve => {
				this.syncProgressSpinner!.getPS(i).setProgress(0, 500, resolve);
			});
		};
		await Promise.all([ani_init(0), ani_init(1), ani_init(2)]);
		this.bindPSWithSyncProgressAfterEnter();
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

	listTrackBy(index){
		return index
	}
}
