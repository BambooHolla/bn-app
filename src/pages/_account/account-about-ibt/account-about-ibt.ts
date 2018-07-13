import { DomSanitizer } from "@angular/platform-browser";
import {
  Component,
  Optional,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountAboutIbtPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public viewCtrl: ViewController,
    public newsService: NewsProvider,
    public sanitizer: DomSanitizer,
    public cdRef: ChangeDetectorRef,
  ) {
    super(navCtrl, navParams, true, tabs);
    // this.auto_header_shadow_when_scroll_down = true;
    // this.auto_header_progress_when_scrol_down = true;
  }
  get version() {
    return AppSettingProvider.APP_VERSION;
  }

  video_list: any[] = [];
  news_list: any[] = [];
  award_list: any[] = [];
  @AccountAboutIbtPage.willEnter
  loadNewsList() {
    this.video_list = [];
    this.news_list = [];
    this.award_list = [];
    const all_news = this.newsService.getNewsList();
    all_news.forEach(news => {
      if (news.tag === "视频") {
        this.video_list.push(news);
      } else if (news.tag === "获奖") {
        this.award_list.push(news);
      } else if (news.tag === "新闻") {
        this.news_list.push(news);
      }
    });

    this.markForCheck();
  }
  showVersionInfo() {
    this.showConfirmDialog(`v${AppSettingProvider.APP_VERSION}`);
  }

  private async _tipThenSendEmail(
    e: MouseEvent,
    tip: string,
    setting_key: string,
  ) {
    let res = this.appSetting.settings[setting_key];
    if (!res) {
      this.appSetting.settings[setting_key] = true;
      res = await this.waitTipDialogConfirm(tip, {
        false_text: "@@CANCEL",
        true_text: "@@SEND_EMAIL",
      });
    }
    if (res) {
      const linkNode = e.target as HTMLDivElement;
      const mailto = linkNode.dataset.href;
      if (mailto && mailto.startsWith("mailto:")) {
        location.href = mailto;
      }
    }
  }
  async doBusinessCooperation(e: MouseEvent) {
    return this._tipThenSendEmail(
      e,
      "@@BUSINESS_COOPERATION_TIP",
      "_is_first_show_send_business_cooperation",
    );
  }
  doUserService(e: MouseEvent) {
    return this._tipThenSendEmail(
      e,
      "@@USER_SERVICE_TIP",
      "_is_first_show_send_user_service",
    );
  }
}
