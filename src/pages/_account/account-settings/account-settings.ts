import { Component, Optional } from "@angular/core";
import { Config, IonicPage, NavController, NavParams } from "ionic-angular";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { AppSettingProvider } from "../../../providers/app-setting/app-setting";
import { LoginServiceProvider } from "../../../providers/login-service/login-service";
import { TabAccountPage } from "../../tab-account/tab-account";

@IonicPage({ name: "account-settings" })
@Component({
  selector: "page-account-settings",
  templateUrl: "account-settings.html",
})
export class AccountSettingsPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public ionicConfig: Config,
    @Optional() public tabs: TabsPage,
    public appSetting: AppSettingProvider,
    public loginService: LoginServiceProvider,
    @Optional() public tabAccount: TabAccountPage,
  ) {
    super(navCtrl, navParams, true, tabs);
    this.auto_header_shadow_when_scroll_down = true;
  }

  @asyncCtrlGenerator.error(() =>
    AccountSettingsPage.getTranslate("SIGNING_OUT_ERROR"),
  )
  async quitAccount() {
    return this.loginService.loginOut();
  }
  checkUpdate() {
    if (this.tabAccount) {
      return this.tabAccount.checkAndroidUpdate();
    }
  }
}
