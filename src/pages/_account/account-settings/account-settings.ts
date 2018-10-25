import { Component, Optional } from "@angular/core";
import { Config, IonicPage, NavController, NavParams } from "ionic-angular/index";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { AppSettingProvider } from "../../../providers/app-setting/app-setting";
import { LoginServiceProvider } from "../../../providers/login-service/login-service";
import { AppFetchProvider } from "../../../providers/app-fetch/app-fetch";
import { TabAccountPage } from "../../tab-account/tab-account";
import { checkUpdate } from "../../tab-account/checkUpdate";
import { FingerprintAIO } from "../../../app/native/fingerprint-aio";

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
    public fetch: AppFetchProvider,
    public faio: FingerprintAIO
  ) {
    super(navCtrl, navParams, true, tabs);
    this.auto_header_shadow_when_scroll_down = true;
  }
  is_support_fingerprint = this.faio
    .isAvailable()
    .then(() => {
      return true;
    })
    .catch(err => {
      console.warn("不支持指纹识别");
      return false;
    });

  @asyncCtrlGenerator.error("@@SIGNING_OUT_ERROR")
  async quitAccount() {
    return this.loginService.loginOut();
  }
  /**
   * 切换账户
   */
  toggleAccount() {
    return this.routeTo("login-account-selector");
  }

  @asyncCtrlGenerator.single()
  @asyncCtrlGenerator.error("@@GET_LATEST_APP_VERSION_INFO_ERROR")
  checkUpdate() {
    return checkUpdate(this.fetch, {
      isAndroid: this.isAndroid,
      isIOS: this.isIOS,
      lang: this.translate.currentLang,
      modalCtrl: this.modalCtrl,
      onNoNeedUpdate: () => {
        this.showSuccessDialog(this.getTranslateSync("APP_IS_NEWEST_VERSION"), "v" + this.baseConfig.APP_VERSION);
      },
    });
  }
}
