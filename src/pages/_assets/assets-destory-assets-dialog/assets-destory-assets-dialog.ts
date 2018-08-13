import { Component, Optional, ViewChild, ElementRef } from "@angular/core";
import {
	IonicPage,
	NavController,
	NavParams,
	Refresher,
	Content,
	ViewController,
} from "ionic-angular";
import { FirstLevelPage } from "../../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import {
	AssetsServiceProvider,
	AssetsModel,
} from "../../../providers/assets-service/assets-service";
type buttonOptions = {
	text: string;
	handler?: Function;
	cssClass?: string;
};

@IonicPage({ name: "assets-destory-assets-dialog" })
@Component({
	selector: "page-assets-destory-assets-dialog",
	templateUrl: "assets-destory-assets-dialog.html",
})
export class AssetsDestoryAssetsDialogPage extends FirstLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		public viewCtrl: ViewController,
		public assetsService: AssetsServiceProvider
	) {
		super(navCtrl, navParams);
	}
	buttons = [
		{
			text: this.getTranslateSync("CANCEL"),
			cssClass: "cancel",
			handler: () => {
				this.closeDialog();
			},
		},
		{
			text: this.getTranslateSync("CONFIRM"),
			cssClass: "ok",
			handler: () => {
				this.submit();
			},
		},
	];
	formData = {
		amount: 0,
	};

	assets_info!: AssetsModel;
	initData() {
		this.assets_info = this.navParams.get("assets");
		if (!this.assets_info) {
			this.closeDialog();
			return;
		}
	}

	closeDialog() {
		this.viewCtrl.dismiss();
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
		if (!res) {
			this.closeDialog();
		}
	}

	@asyncCtrlGenerator.loading()
	@asyncCtrlGenerator.error()
	@asyncCtrlGenerator.success()
	async submit() {
		const { password, pay_pwd, custom_fee } = await this.getUserPassword({
			custom_fee: true,
		});
		return this.assetsService.destoryAssets(
			this.assets_info,
			this.formData.amount,
			custom_fee,
			password,
			pay_pwd
		);
	}
}
