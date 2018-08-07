import { Component, Optional } from "@angular/core";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import {
	IonicPage,
	NavController,
	NavParams,
	ViewController,
} from "ionic-angular";
import { TransactionModel } from "../../providers/transaction-service/transaction-service";

// @IonicPage({ name: "user-agreement" })
@Component({
	selector: "page-user-agreement",
	templateUrl: "user-agreement.html",
})
export class UserAgreementPage extends FirstLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		public viewCtrl: ViewController,
	) {
		super(navCtrl, navParams);
	}
	close() {
		this.viewCtrl.dismiss();
	}
	agree() {
		this.viewCtrl.dismiss(true);
	}
	private _anode?: HTMLAnchorElement;
	mailto() {
		if (!this._anode) {
			this._anode = document.createElement("a");
			this._anode.href = `mailto:?subject=${
				/*encodeURIComponent*/ (document.querySelector(
					"page-user-agreement .toolbar-title",
				) as HTMLElement).textContent || ""
			}&body=${
				/*encodeURIComponent*/ (document.querySelector(
					"page-user-agreement .pdf",
				) as HTMLElement).textContent || ""
			}`;
		}
		const clickEvent = new MouseEvent("click", {
			view: window,
			bubbles: true,
			cancelable: true,
		});
		this._anode.dispatchEvent(clickEvent);
	}
}
