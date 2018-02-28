import { DomSanitizer } from "@angular/platform-browser";
import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import {
	IonicPage,
	NavController,
	NavParams,
	ViewController,
} from "ionic-angular";

@IonicPage({ name: "account-news-detail" })
@Component({
	selector: "page-account-news-detail",
	templateUrl: "account-news-detail.html",
})
export class AccountNewsDetailPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public viewCtrl: ViewController,
		public sanitizer: DomSanitizer,
	) {
		super(navCtrl, navParams, true, tabs);
	}

	news_detail?: any;

	@AccountNewsDetailPage.willEnter
	setMewsDetail() {
		const news = this.navParams.get("news");
		if (!news) {
			return this.navCtrl.goToRoot({});
		}
		this.news_detail = news;
	}
}
