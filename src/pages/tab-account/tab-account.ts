import { Component, ChangeDetectorRef, ChangeDetectionStrategy } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular/index";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { UserInfoProvider } from "../../providers/user-info/user-info";
import { AppSettingProvider } from "../../providers/app-setting/app-setting";
import { AssetsServiceProvider, AssetsPersonalModelWithLogoSafeUrl } from "../../providers/assets-service/assets-service";

import { AppFetchProvider } from "../../providers/app-fetch/app-fetch";
import { LATEST_VERSION_INFO } from "../version-update-dialog/version.types";
import { checkUpdate } from "./checkUpdate";
import { VoucherServiceProvider } from "../../providers/voucher-service/voucher-service";
import { Subscription } from "rxjs/Subscription";

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
    public assetsService: AssetsServiceProvider
  ) {
    super(navCtrl, navParams);
    this.registerViewEvent(this.userInfo, "changed", () => {
      this.markForCheck();
    });
    fetch.on("ononline", () => {
      this.checkAndroidUpdate();
    });
  }
  force_show_hidden = false;
  get hasBalance() {
    if (this.force_show_hidden) {
      return true;
    }
    if (this._my_assets_list && this._my_assets_list.length > 0) {
      return true;
    }
    return parseFloat(this.userInfo.balance) !== 0;
  }

  /// 获取其它数字资产，如果有其它数字资产，说明这个账户有过一些活动记录，那么当作有账户余额的账户来提供更多的功能
  private _my_assets_list?: AssetsPersonalModelWithLogoSafeUrl[];
  @TabAccountPage.willEnter
  @TabAccountPage.addEvent("HEIGHT:CHANGED")
  @asyncCtrlGenerator.error("@@FETCH_MY_ASSETS_LIST_ERROR")
  private async _checkHasAssetsBalance() {
    this._my_assets_list = await this.assetsService.myAssetsList.getPromise();
  }

  @TabAccountPage.didEnter
  async isShowMiningIncomeNotice() {
    /// 开启收益提醒
    if (!this.appSetting.settings._is_first_balance_grow_up_notice) {
      this.appSetting.settings._is_first_balance_grow_up_notice = true;
      let res = await this.waitTipDialogConfirm("@@SHOW_INCOME_IBT_NOTICE_TIP", {
        true_text: "@@YES_I_NEED",
      });
      this.appSetting.settings.mining_income_notice = res;
      if (res) {
        res = await this.waitTipDialogConfirm("@@AFTER_SHOW_INCOME_IBT_NOTICE_TIP", {
          true_text: "@@OK_I_KNOWN",
          false_text: "@@NO_NOTICE_ME",
        });
      }
      this.appSetting.settings.mining_income_notice = res;
    }
    /// 开启余额过多必须设置支付密码的提醒
    if (
      !this.userInfo.isFreezed &&
      !this.userInfo.hasSecondPwd &&
      !sessionStorage.getItem("TOO_MANY_IBT_SHOULD_SET_THE_PAYMENT_PASSWORD_TIP") &&
      parseFloat(this.userInfo.balance) / 1e8 >= 10
    ) {
      sessionStorage.setItem("TOO_MANY_IBT_SHOULD_SET_THE_PAYMENT_PASSWORD_TIP", "true");
      if (
        await this.waitTipDialogConfirm("@@TOO_MANY_IBT_SHOULD_SET_THE_PAYMENT_PASSWORD_TIP", {
          true_text: "@@SET_NOW",
          false_text: "@@NOT_SET",
        })
      ) {
        return this.routeTo("settings-set-pay-pwd", { auto_return: true });
      }
    }
  }

  app_version_info?: LATEST_VERSION_INFO;

  async openSharePanel() {
    if (!this.appSetting.settings._is_fisrt_show_share_app) {
      this.appSetting.settings._is_fisrt_show_share_app = await this.waitTipDialogConfirm("@@SHARE_APP_TIP");
    }
    var message = await this.getTranslate("WELCOME_TO_DOWNLOAD_IBT_APP");
    var web_link = "https://www.ifmchain.com/downloadv2.0.html";
    var image_url;
    if (this.app_version_info) {
      message = this.app_version_info.share_message || message;
      web_link = this.app_version_info.share_link || this.app_version_info.download_link_web || web_link;
      image_url = this.app_version_info.share_image_url || image_url;
    }
    this.modalCtrl
      .create(
        "share-app-panel",
        { message, link: web_link, image_url },
        {
          enterAnimation: "custom-dialog-pop-in",
          leaveAnimation: "custom-dialog-pop-out",
        }
      )
      .present();
  }

  @TabAccountPage.markForCheck voucher_total_amount = 0;
  @TabAccountPage.willEnter
  async initVoucherData() {
    this.voucher_total_amount = await this.voucherService.getTotalAmount();
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
      this.appSetting.settings.auto_update_app /*用来判定是否打开升级的对话框*/
    );
  }
  /*跳转到我的本地的关注并显示提示*/
  async routeToMyContacts() {
    if (!this.appSetting.settings._is_show_first_local_contacts_tip) {
      this.appSetting.settings._is_show_first_local_contacts_tip = await this.waitTipDialogConfirm("@@MY_LOCAL_CONTACTS_TIP");
    }
    return this.routeTo("account-my-local-contacts");
  }

  /// 隐藏功能
  @asyncCtrlGenerator.tttttap({times:1})
  tryTogglaHiddenItems() {
    this.force_show_hidden = !this.force_show_hidden;
  }
}
