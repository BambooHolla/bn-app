import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { UserInfoProvider } from "../../providers/user-info/user-info";
import { AppSettingProvider } from "../../providers/app-setting/app-setting";

import { AppFetchProvider } from "../../providers/app-fetch/app-fetch";
import { LATEST_VERSION_INFO } from "../version-update-dialog/version.types";

@Component({
  selector: "page-tab-account",
  templateUrl: "tab-account.html",
})
export class TabAccountPage extends FirstLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public user: UserInfoProvider,
    public fetch: AppFetchProvider,
  ) {
    super(navCtrl, navParams);
  }
  get ibt() {
    return this.user.balance;
  }
  get dollar() {
    return parseFloat(this.user.balance) * 20;
  }
  get address() {
    return this.user.address;
  }
  @TabAccountPage.onInit
  @asyncCtrlGenerator.error("@@GET_LATEST_APP_VERSION_INFO_ERROR")
  async checkAndroidUpdate() {
    const app_version_info = await this.fetch.get<LATEST_VERSION_INFO>(
      AppSettingProvider.LATEST_APP_VERSION_URL,
      {
        search: {
          lang: this.translate.currentLang,
        },
      },
    );
    if (app_version_info.version !== AppSettingProvider.APP_VERSION) {
      return this.modalCtrl
        .create(
          "version-update-dialog",
          { version_info: app_version_info },
          {
            enterAnimation: "custom-dialog-pop-in",
            leaveAnimation: "custom-dialog-pop-out",
          },
        )
        .present();
    }
  }
}
