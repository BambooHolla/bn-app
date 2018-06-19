import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { AccountServiceProvider } from "../../../providers/account-service/account-service";

@IonicPage({ name: "settings-set-pay-pwd" })
@Component({
  selector: "page-settings-set-pay-pwd",
  templateUrl: "settings-set-pay-pwd.html",
})
export class SettingsSetPayPwdPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public accountService: AccountServiceProvider,
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  formData = {
    pay_pwd: "",
    confrim_pay_pwd: "",
    transfer_fee: parseFloat(this.appSetting.settings.default_fee),
  };
  @asyncCtrlGenerator.error("@@FEE_INPUT_ERROR")
  async setTransferFee() {
    const { custom_fee } = await this.getCustomFee(this.formData.transfer_fee);
    this.formData.transfer_fee = custom_fee;
  }

  @asyncCtrlGenerator.error()
  async submit() {
    const { password, pay_pwd } = await this.getUserPassword({
      title: "@@SET_PAY_PWD_TITLE",
      force_require_password: true,
    });
    return this._submit(password, this.formData.transfer_fee, pay_pwd);
  }
  @asyncCtrlGenerator.loading(() =>
    SettingsSetPayPwdPage.getTranslate("SET_PAY_PWD_SUBMITING"),
  )
  @asyncCtrlGenerator.error(() =>
    SettingsSetPayPwdPage.getTranslate("SET_PAY_PWD_SUBMIT_ERROR"),
  )
  @asyncCtrlGenerator.success(() =>
    SettingsSetPayPwdPage.getTranslate("SET_PAY_PWD_SUBMIT_SUCCESS"),
  )
  async _submit(password: string, custom_fee?: number, old_pay_pwd?: string) {
    return this.accountService
      .setSecondPassphrase(
        password,
        this.formData.pay_pwd,
        old_pay_pwd,
        custom_fee,
      )
      .then(() => {
        this.finishJob();
      });
  }

  @SettingsSetPayPwdPage.setErrorTo("errors", "confrim_pay_pwd", ["noSame"])
  check_TwoPwd() {
    const res: any = {};
    if (this.formData.confrim_pay_pwd !== this.formData.pay_pwd) {
      res.noSame = true;
    }
    return res;
  }
}
