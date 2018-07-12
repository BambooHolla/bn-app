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
    this.cdRef.markForCheck();
  }
  showVersionInfo() {
    this.showConfirmDialog(`v${AppSettingProvider.APP_VERSION}`);
  }

  private async _tipThenSendEmail(e: MouseEvent, tip: string) {
    if (
      await this.waitTipDialogConfirm(tip, {
        false_text: "@@CANCEL",
        true_text: "@@SEND_EMAIL",
      })
    ) {
      const linkNode = e.target as HTMLDivElement;
      const mailto = linkNode.dataset.href;
      if (mailto && mailto.startsWith("mailto:")) {
        location.href = mailto;
      }
    }
  }
  doBusinessCooperation(e: MouseEvent) {
    return this._tipThenSendEmail(e, "@@BUSINESS_COOPERATION_TIP");
  }
  doUserService(e: MouseEvent) {
    return this._tipThenSendEmail(e, "@@USER_SERVICE_TIP");
  }
}
