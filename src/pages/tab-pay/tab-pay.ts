import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";

@IonicPage({ name: "TabPay" })
@Component({
	selector: "page-tab-pay",
	templateUrl: "tab-pay.html",
})
export class TabPayPage extends FirstLevelPage {
	constructor(public navCtrl: NavController, public navParams: NavParams) {
		super(navCtrl, navParams);
	}

	ionViewDidLoad() {
		console.log("ionViewDidLoad TabPayPage");
	}
}
