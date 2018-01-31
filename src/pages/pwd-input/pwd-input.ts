import { Component } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
} from "ionic-angular";
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
    public c: AccountServiceProvider,
  ) {
    super(navCtrl, navParams);
  }
  formData = this._initFormData();
  private _initFormData() {
    return {
      password: this.userInfo.password,
      have_password: !!this.userInfo.password,
      pay_pwd: this.userInfo.hasSecondPwd ? "" : "NO NEED",
      need_pay_pwd: this.userInfo.hasSecondPwd,
    };
  }
  // @PwdInputPage.setErrorTo("errors","password",["VerificationFailure"])
  // check_password(){
  //   if(this.formData.password!==this.userInfo.password){
  //   }
  // }
  @PwdInputPage.setErrorTo("errors", "pay_pwd", ["VerificationFailure"])
  check_pay_pwd() {
    if (
      this.formData.need_pay_pwd &&
      !this.transactionService.verifySecondPassphrase(this.formData.pay_pwd)
    ) {
      return {
        VerificationFailure: true,
      };
    }
  }

  @PwdInputPage.willEnter
  init() {
    // 重置表单
    this.formData = this._initFormData();
    const force_require_password = this.navParams.get("force_require_password");
    if (force_require_password) {
      this.formData.password = "";
      this.formData.have_password = false;
    }
  }
  submitData() {
    this.viewCtrl.dismiss(this.formData);
  }
}
