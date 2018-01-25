import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";

@IonicPage({ name: "vote-delegate-detail" })
@Component({
	selector: "page-vote-delegate-detail",
	templateUrl: "vote-delegate-detail.html",
})
export class VoteDelegateDetailPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
	) {
		super(navCtrl, navParams, true, tabs);
	}
	delegate_info: any;
	@VoteDelegateDetailPage.willEnter
	async initData() {
		await new Promise(cb => setTimeout(cb, 1000));
		this.delegate_info = {
			username: "Gaubee",
			address: "aFJe90Uwc4SsmKI122fmKI122f90faOKJFES90faOKJFESIOe",
			get_vote_rate: Math.random() * 100,
		};
	}
}
