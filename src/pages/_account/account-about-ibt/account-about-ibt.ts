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
import { NewsProvider } from "../../../providers/news/news";
import { AppSettingProvider } from "../../../providers/app-setting/app-setting";

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
    public sanitizer: DomSanitizer,
  ) {
    super(navCtrl, navParams, true, tabs);
    this.auto_header_shadow_when_scroll_down = true;
    this.auto_header_progress_when_scrol_down = true;
  }

  news_list: any[] = [];
  @AccountAboutIbtPage.willEnter
  loadNewsList() {
    const news_list = this.newsService.getNewsList();
    // news_list.forEach(news => {
    //   if (news.type === "embed") {
    //     this.sanitizer.bypassSecurityTrustHtml();
    //   }
    // });
    this.news_list = news_list;
  }
  showVersionInfo() {
    this.showConfirmDialog(`v${AppSettingProvider.APP_VERSION}`);
  }
}
