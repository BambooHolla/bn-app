import { Component, Optional, ViewChild, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy } from "@angular/core";
import { IonicPage, NavController, NavParams, Refresher, Content, ViewController } from "ionic-angular/index";
import { FirstLevelPage } from "../../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { AssetsServiceProvider, AssetsPersonalModelWithLogoSafeUrl } from "../../../providers/assets-service/assets-service";
type buttonOptions = {
	text: string;
	handler?: Function;
	cssClass?: string;
};

@IonicPage({ name: "assets-destory-assets-dialog" })
@Component({
	selector: "page-assets-destory-assets-dialog",
	templateUrl: "assets-destory-assets-dialog.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetsDestoryAssetsDialogPage extends FirstLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		public viewCtrl: ViewController,
		public assetsService: AssetsServiceProvider,
		public cdRef: ChangeDetectorRef
	) {
		super(navCtrl, navParams);
	}
	buttons = [
		{
			text: this.getTranslateSync("CANCEL"),
			cssClass: "cancel",
			handler: () => {
				return this.closeDialog();
			},
		},
		{
			text: this.getTranslateSync("CONFIRM"),
			cssClass: "ok",
			handler: () => {
				return this.submit();
			},
		},
	];
	formData: { amount?: number } = {
		amount: undefined,
	};
	@AssetsDestoryAssetsDialogPage.setErrorTo("errors", "amount", ["RANGE_ERROR"])
	check_amount() {
		const res: any = {};
		let { amount } = this.formData;
		if (typeof amount !== "undefined") {
			amount *= 1e8;
			const hodingAssets = parseFloat(this.assets_info.hodingAssets);
			if (amount <= 0 || amount > hodingAssets) {
				res.RANGE_ERROR = "DESTORY_ASSETS_RANGE_ERROR";
			}
		}
		return res;
	}

	assets_info!: AssetsPersonalModelWithLogoSafeUrl;

	@AssetsDestoryAssetsDialogPage.willEnter
	initData() {
		this.assets_info = this.navParams.get("assets");
		if (!this.assets_info) {
			this.closeDialog();
			return;
		}
		this.getRate();
	}

	@AssetsDestoryAssetsDialogPage.addEventAfterDidEnter("HEIGHT:CHANGED")
	async updateAssetsInfo() {
		const { assets_info } = this;
		if (!assets_info) {
			return;
		}
		const my_assets_list = await this.assetsService.myAssetsList.getPromise();
		const new_assets_info = my_assets_list.find(assets => assets.abbreviation === assets_info.abbreviation);
		if (!new_assets_info) {
			return;
		}
		this.assets_info = new_assets_info;
		return this.getRate();
	}

	rate = 1;
	@asyncCtrlGenerator.error()
	async getRate() {
		return this.assetsService.getAssetsToIBTRateByCache(this.assets_info).then(rate => (this.rate = rate));
	}

	closeDialog() {
		return this.viewCtrl.dismiss();
	}
	tryCloseDialog(event) {
		if (event.target.classList.contains("scroll-content")) {
			if (this.buttons.length == 0) {
				this.closeDialog();
			}
		}
	}
	@asyncCtrlGenerator.error()
	async runButtonHandler(button: buttonOptions) {
		var res;
		if (button.handler instanceof Function) {
			res = await button.handler();
		}
	}

	@asyncCtrlGenerator.single()
	@asyncCtrlGenerator.loading()
	@asyncCtrlGenerator.error()
	@asyncCtrlGenerator.success()
	async submit() {
		const { password, pay_pwd, custom_fee } = await this.getUserPassword({
			custom_fee: true,
		});
		await this.assetsService.destoryAssets(this.assets_info, this.formData.amount as number, custom_fee, password, pay_pwd);
		return this.closeDialog();
	}
}
