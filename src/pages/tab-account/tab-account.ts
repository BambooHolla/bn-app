import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { UserInfoProvider } from "../../providers/user-info/user-info";
import { AppSettingProvider } from "../../providers/app-setting/app-setting";

import { AppFetchProvider } from "../../providers/app-fetch/app-fetch";
import { LATEST_VERSION_INFO } from "../version-update-dialog/version.types";
import { versionToNumber } from "../version-update-dialog/version-update-dialog";

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
  app_version_info?: LATEST_VERSION_INFO;

  async openSharePanel() {
    var message = await this.getTranslate("WELCOME_TO_DOWNLOAD_IBT_APP");
    var web_link = "https://www.ifmchain.com/downloadv2.0.html";
    var image_url;
    if (this.app_version_info) {
      message = this.app_version_info.share_message || message;
      web_link =
        this.app_version_info.share_link ||
        this.app_version_info.download_link_web ||
        web_link;
      image_url = this.app_version_info.share_image_url || image_url;
    }
    this.modalCtrl
      .create(
        "share-app-panel",
        { message, link: web_link, image_url },
        {
          enterAnimation: "custom-dialog-pop-in",
          leaveAnimation: "custom-dialog-pop-out",
        },
      )
      .present();
  }
  @TabAccountPage.onInit
  @asyncCtrlGenerator.error("@@GET_LATEST_APP_VERSION_INFO_ERROR")
  async checkAndroidUpdate() {
    const app_version_info = (this.app_version_info = await this.fetch.get<
      LATEST_VERSION_INFO
    >(AppSettingProvider.LATEST_APP_VERSION_URL, {
      search: {
        lang: this.translate.currentLang,
        ua: navigator.userAgent,
      },
    }));
    if (app_version_info.disable_android && this.isAndroid) {
      return;
    }
    if (app_version_info.disable_ios && this.isIOS) {
      return;
    }
    var version = app_version_info.version;
    if (this.isAndroid && app_version_info.android_version) {
      version = app_version_info.android_version;
    }
    if (this.isIOS && app_version_info.ios_version) {
      version = app_version_info.ios_version;
    }
    if (
      versionToNumber(version) > versionToNumber(AppSettingProvider.APP_VERSION)
    ) {
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
