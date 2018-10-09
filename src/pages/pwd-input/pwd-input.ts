import { Component } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
} from "ionic-angular/index";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { UserInfoProvider } from "../../providers/user-info/user-info";
import { TransactionServiceProvider } from "../../providers/transaction-service/transaction-service";
import { AccountServiceProvider } from "../../providers/account-service/account-service";

@IonicPage({ name: "pwd-input" })
@Component({
  selector: "page-pwd-input",
  templateUrl: "pwd-input.html",
})
export class PwdInputPage extends FirstLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public transactionService: TransactionServiceProvider,
    public c: AccountServiceProvider
  ) {
    super(navCtrl, navParams);
  }
  formData = this._initFormData();
  formDataKeyI18nMap = {
    password: "@@LOGIN_PASSPHRASE",
    pay_pwd: "@@PAY_PASSPHRASE",
    custom_fee: "@@TRANSACTION_FEES",
  };
  private _initFormData() {
    return {
      password: this.userInfo.password,
      have_password: !!this.userInfo.password,
      pay_pwd: "",
      need_pay_pwd: this.userInfo.hasSecondPwd,
      need_custom_fee: false,
      custom_fee: this.appSetting.settings.default_fee,
    };
  }
  ignore_keys = ["pay_pwd"];
  get canSubmit() {
    const canSubmit = super.canSubmit;
    if (canSubmit) {
      if (this.formData.need_pay_pwd) {
        return !!this.formData.pay_pwd;
      }
    }
    return canSubmit;
  }
  // @PwdInputPage.setErrorTo("errors","password",["VerificationFailure"])
  // check_password(){
  //   if(this.formData.password!==this.userInfo.password){
  //   }
  // }
  @PwdInputPage.setErrorTo(
    "errors",
    "pay_pwd",
    ["VerificationFailure", "NeedInput"],
    {
      check_when_empty: true,
    }
  )
  check_pay_pwd() {
    if (this.formData.need_pay_pwd) {
      if (this.formData.pay_pwd) {
        if (
          !this.transactionService.verifySecondPassphrase(this.formData.pay_pwd)
        ) {
          return {
            VerificationFailure: "@@PAY_PWD_VERIFICATION_FAILURE",
          };
        }
      } else {
        return {
          NeedInput: this.getTranslateSync("NEED_INPUT_#FORM_KEY#", {
            form_key: this.getTranslateSync("PAY_PASSPHRASE"),
          }),
        };
      }
    }
  }

  @PwdInputPage.setErrorTo("errors", "custom_fee", [
    "NoBalance",
    "NoEnoughBalance",
    "ErrorRange",
  ])
  check_custom_fee(fee = this.formData.custom_fee) {
    if (!this.formData.need_custom_fee) {
      return;
    }
    const user_balance = parseFloat(this.userInfo.balance) / 1e8;
    const custom_fee = parseFloat(fee);
    if (user_balance === 0) {
      return {
        NoBalance: "@@USER_HAS_NO_BALANCE",
      };
    }
    if (custom_fee > user_balance) {
      return {
        NoEnoughBalance: "@@USER_HAS_NO_ENOUGH_BALANCE",
      };
    }
    if (custom_fee < 0.00000001) {
      return {
        ErrorRange: "@@TOO_LITTLE_FEE",
      };
    }
  }

  custom_title?: string;
  @PwdInputPage.willEnter
  init() {
    // 重置表单
    this.formData = this._initFormData();
    const force_require_password = this.navParams.get("force_require_password");
    if (force_require_password) {
      this.formData.password = "";
      this.formData.have_password = false;
    }
    const custom_fee = this.navParams.get("custom_fee");
    if (custom_fee) {
      this.formData.need_custom_fee = true;
    }
    const custom_title = this.navParams.get("title");
    if (typeof custom_title === "string") {
      if (custom_title.startsWith("@@")) {
        this.custom_title = this.getTranslateSync(custom_title.substr(2));
      } else {
        this.custom_title = custom_title;
      }
    }
  }
  submitData() {
    const formData = {
      ...this.formData,
      custom_fee: parseFloat(this.formData.custom_fee),
    };
    this.viewCtrl.dismiss(formData);
  }

  closeDialog() {
    this.viewCtrl.dismiss();
  }
}
