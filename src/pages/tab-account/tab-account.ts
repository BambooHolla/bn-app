import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";

@IonicPage({ name: "tab-account" })
@Component({
	selector: "page-tab-account",
	templateUrl: "tab-account.html",
})
export class TabAccountPage extends FirstLevelPage {
	constructor(public navCtrl: NavController, public navParams: NavParams) {
		super(navCtrl, navParams);
	}
}
