import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";

@IonicPage({ name: "tab-chain" })
@Component({
	selector: "page-tab-chain",
	templateUrl: "tab-chain.html",
})
export class TabChainPage extends FirstLevelPage {
	constructor(public navCtrl: NavController, public navParams: NavParams) {
		super(navCtrl, navParams);
	}

	ionViewDidLoad() {
		console.log("ionViewDidLoad TabChainPage");
	}
}
