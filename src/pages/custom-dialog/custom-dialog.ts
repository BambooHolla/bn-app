import { Component, Optional, ViewChild, ElementRef } from "@angular/core";
import {
	IonicPage,
	NavController,
	NavParams,
	Refresher,
	Content,
	ViewController,
} from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
type buttonOptions = {
	text: string;
	handler?: Function;
	cssClass?: string;
};

@Component({
	selector: "page-custom-dialog",
	templateUrl: "custom-dialog.html",
})
export class CustomDialogPage extends FirstLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		public viewCtrl: ViewController,
	) {
		super(navCtrl, navParams);
	}
	message = "";
	buttons: Array<buttonOptions> = [];
	cssClass = "";
	iconType = "";
	@CustomDialogPage.willEnter
	initParams() {
		this.buttons = this.navParams.get("buttons");
		this.message = this.navParams.get("message");
		this.iconType = this.navParams.get("iconType");
		this.cssClass = this.navParams.get("cssClass");
	}
	closeDialog() {
		this.viewCtrl.dismiss();
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
}
