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

@IonicPage({ name: "account-faq" })
@Component({
  selector: "page-account-faq",
  templateUrl: "account-faq.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountFaqPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public viewCtrl: ViewController,
    public newsService: NewsProvider,
    public sanitizer: DomSanitizer,
    public cdRef: ChangeDetectorRef
  ) {
    super(navCtrl, navParams, true, tabs);
    // this.auto_header_shadow_when_scroll_down = true;
    // this.auto_header_progress_when_scrol_down = true;
  }
}
