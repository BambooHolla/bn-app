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
}
