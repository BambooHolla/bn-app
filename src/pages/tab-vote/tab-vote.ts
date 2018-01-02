import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";

@IonicPage({ name: "TabVote" })
@Component({
	selector: "page-tab-vote",
	templateUrl: "tab-vote.html",
})
export class TabVotePage extends FirstLevelPage {
	constructor(public navCtrl: NavController, public navParams: NavParams) {
		super(navCtrl, navParams);
	}

}
