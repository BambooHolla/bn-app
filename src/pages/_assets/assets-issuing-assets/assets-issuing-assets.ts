import {
	ViewChild,
	Component,
	Optional,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
} from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { sleep } from "../../../bnqkl-framework/PromiseExtends";
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
	SingleBlockModel,
} from "../../../providers/block-service/block-service";
import { MatAutocomplete } from "@angular/material";

@IonicPage({ name: "assets-issuing-assets" })
@Component({
	selector: "page-assets-issuing-assets",
	templateUrl: "assets-issuing-assets.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetsIssuingAssetsPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public cdRef: ChangeDetectorRef,
		public viewCtrl: ViewController,
		public blockService: BlockServiceProvider,
	) {
		super(navCtrl, navParams, true, tabs);
	}
	formData: {
		rate?: number;
		assetName: string;
		logo: string;
		abbreviation: string;
		summary: string;
		originalIssuedAssets?: number;
		expectedRaisedIBTs?: number;
		expectedIssuedBlockHeight?: number;
	} = {
		rate: undefined,
		assetName: "",
		logo: "",
		abbreviation: "",
		summary: "",
		originalIssuedAssets: undefined,
		expectedRaisedIBTs: undefined,
		expectedIssuedBlockHeight: undefined,
	};
	summary_maxlength = 200;

	private _blockHeightTime_Lock_map = new Map<number, Promise<number>>();

	blockHeightTime(height = this.formData.expectedIssuedBlockHeight) {
		if (!height) {
			return;
		}
		const { lastBlock } = this;
		const diff_height = height - lastBlock.height;
		return (
			this.blockService.getFullTimestamp(lastBlock.timestamp) +
			diff_height * this.appSetting.BLOCK_UNIT_TIME
		);
	}
	@AssetsIssuingAssetsPage.markForCheck
	lastBlock: SingleBlockModel = { height: 1, timestamp: 0, id: "" };
	/*自动补全*/
	@AssetsIssuingAssetsPage.markForCheck
	expectedIssuedBlockHeightOptions: number[] = [];

	private _expectedIssuedBlockHeightOptions: number[] = [];
	@AssetsIssuingAssetsPage.addEventAfterDidEnter("HEIGHT:CHANGED")
	watchHeightChanged() {
		const height = this.appSetting.getHeight();
		/*7*24*60*60/128 = 4725*/
		const weakly_height =
			(7 * 24 * 60 * 60 * 1000) / this.appSetting.BLOCK_UNIT_TIME;
		// 一个季度的时间，3月*4周
		this._expectedIssuedBlockHeightOptions = Array.from({ length: 12 }).map(
			(_, i) => height + weakly_height * (i + 1),
		);

		this.blockService.lastBlock.getPromise().then(b => {
			this.lastBlock = b;
		});
	}
	@ViewChild("autoExpectedIssuedBlockHeight") autoHeight!: MatAutocomplete;

	@AssetsIssuingAssetsPage.didEnter
	init_delaySetHeightOptions() {
		let show_options_ti;
		this.event.on("input-status-changed", ({ key: formKey, event: e }) => {
			if (formKey !== "expectedIssuedBlockHeight") {
				return;
			}
			if (e.type === "focus") {
				clearTimeout(show_options_ti);
				show_options_ti = setTimeout(() => {
					this._delaySetHeightOptions();
				}, 500);
			} else if (e.type === "blur") {
				clearTimeout(show_options_ti);
				show_options_ti = setTimeout(() => {
					this._delayUnSetHeightOptions();
				}, 500);
			}
		});
	}
	private _delaySetHeightOptions() {
		this.expectedIssuedBlockHeightOptions = this._expectedIssuedBlockHeightOptions;
	}
	private _delayUnSetHeightOptions() {
		this.expectedIssuedBlockHeightOptions = [];
	}
	/**选择资产logo图片*/
	pickAssetsLogo() {
		const inputEle = document.createElement("input");
		inputEle.type = "file";
		inputEle.accept = "image/*";
		const clickEvent = new MouseEvent("click", {
			view: window,
			bubbles: true,
			cancelable: true,
		});
		inputEle.dispatchEvent(clickEvent);
		inputEle.onchange = e => {
			if (inputEle.files && inputEle.files[0]) {
				this.formData.logo = URL.createObjectURL(inputEle.files[0]);
			} else {
				console.log("没有选择文件，代码不应该运行到这里");
			}
		};
	}
	/**logo格式化成统一的大小*/
	format
	/**提交数字资产表单*/
	submit() {

	}
}
