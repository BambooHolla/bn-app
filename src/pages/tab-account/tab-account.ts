import {
  Component,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { UserInfoProvider } from "../../providers/user-info/user-info";
import { AppSettingProvider } from "../../providers/app-setting/app-setting";

import { AppFetchProvider } from "../../providers/app-fetch/app-fetch";
import { LATEST_VERSION_INFO } from "../version-update-dialog/version.types";
import { checkUpdate } from "./checkUpdate";
import { VoucherServiceProvider } from "../../providers/voucher-service/voucher-service";

@Component({
  selector: "page-tab-account",
  templateUrl: "tab-account.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabAccountPage extends FirstLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public fetch: AppFetchProvider,
    public cdRef: ChangeDetectorRef,
    public voucherService: VoucherServiceProvider,
  ) {
    super(navCtrl, navParams);
    this.registerViewEvent(this.userInfo, "changed", () => {
      this.cdRef.markForCheck();
    });
    fetch.on("ononline", () => {
      this.checkAndroidUpdate();
    });
  }

  get ibt() {
    return this.userInfo.balance;
  }
  get dollar() {
    return parseFloat(this.userInfo.balance) * 50;
  }
  get address() {
    return this.userInfo.address;
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

  voucher_total_amount = 0;
  @TabAccountPage.willEnter
  async initVoucherData() {
    this.voucher_total_amount = await this.voucherService.getTotalAmount();
    this.cdRef.markForCheck();
  }

  @TabAccountPage.onInit
  @asyncCtrlGenerator.single()
  @asyncCtrlGenerator.error("@@GET_LATEST_APP_VERSION_INFO_ERROR")
  async checkAndroidUpdate() {
    this.app_version_info = await checkUpdate(
      this.fetch,
      {
        isAndroid: this.isAndroid,
        isIOS: this.isIOS,
        lang: this.translate.currentLang,
        modalCtrl: this.modalCtrl,
      },
      this.appSetting.settings.auto_update_app /*用来判定是否打开升级的对话框*/,
    );
  }
  /*跳转到我的本地的关注并显示提示*/
  async routeToMyContacts() {
    if (!this.appSetting.settings._is_show_first_local_contacts_tip) {
      this.appSetting.settings._is_show_first_local_contacts_tip = await this.waitTipDialogConfirm(
        "@@MY_LOCAL_CONTACTS_TIP",
      );
    }
    return this.routeTo("account-my-local-contacts");
  }
}
