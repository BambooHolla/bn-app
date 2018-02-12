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
import { NewsProvider } from "../../../providers/news/news";

@IonicPage({ name: "account-about-ibt" })
@Component({
	selector: "page-account-about-ibt",
	templateUrl: "account-about-ibt.html",
})
export class AccountAboutIbtPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public viewCtrl: ViewController,
		public newsService: NewsProvider,
	) {
		super(navCtrl, navParams, true, tabs);
	}

	news_list: any[] = []
	@AccountAboutIbtPage.willEnter
	loadNewsList() {
		this.news_list = this.newsService.getNewsList()
	}
}
