import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular/index";
import { AccountServiceProvider } from "../../../providers/account-service/account-service";

@IonicPage({ name: "account-set-username" })
@Component({
  selector: "page-account-set-username",
  templateUrl: "account-set-username.html",
})
export class AccountSetUsernamePage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public accountService: AccountServiceProvider
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  formData = {
    username: "",
    transfer_fee: parseFloat(this.appSetting.settings.default_fee),
  };
  @AccountSetUsernamePage.setErrorTo("errors", "username", [
    // "tooShort",
    "tooLong",
    "haveSpaces",
  ])
  check_username() {
    const res: any = {};
    if (/\s/.test(this.formData.username)) {
      res.haveSpaces = true;
    }
    if (this.formData.username.length > 20) {
      res.tooLong = true;
    }
    return res;
  }
  @asyncCtrlGenerator.error("@@FEE_INPUT_ERROR")
  async setTransferFee() {
    const { custom_fee } = await this.getCustomFee(this.formData.transfer_fee);
    this.formData.transfer_fee = custom_fee;
  }

  @asyncCtrlGenerator.error()
  async submit() {
    const { password, pay_pwd } = await this.getUserPassword({
      title: "@@ACCOUNT_SET_USERNAME_TITLE",
    });
    return this._submit(password, this.formData.transfer_fee, pay_pwd);
  }

  @asyncCtrlGenerator.error("@@SET_USERNAME_SUBMIT_ERROR")
  @asyncCtrlGenerator.loading("@@SET_USERNAME_SUBMITING")
  @asyncCtrlGenerator.success("@@SET_USERNAME_SUBMIT_SUCCESS")
  async _submit(password: string, custom_fee: number, secondSecret?: string) {
    return this.accountService
      .changeUsername(
        this.formData.username,
        password,
        secondSecret,
        custom_fee
      )
      .then(() => {
        this.finishJob();
      });
  }
}
