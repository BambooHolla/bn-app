import { Component, Optional } from "@angular/core";
import { Config, IonicPage, NavController, NavParams } from "ionic-angular";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { AppSettingProvider } from "../../../providers/app-setting/app-setting";
import { LoginServiceProvider } from "../../../providers/login-service/login-service";

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
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  auto_header_shadow_when_scroll_down = true;

  @asyncCtrlGenerator.error(() =>
    AccountSettingsPage.getTranslate("LOGIN_OUT_ERROR"),
  )
  async quitAccount() {
    return this.loginService.loginOut();
  }
}
