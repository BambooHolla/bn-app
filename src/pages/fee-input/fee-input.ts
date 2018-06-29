import { Component } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
} from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";

@IonicPage({ name: "fee-input" })
@Component({
  selector: "page-fee-input",
  templateUrl: "fee-input.html",
})
export class FeeInputPage extends FirstLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
  ) {
    super(navCtrl, navParams);
  }
  formData = this._initFormData();
  formDataKeyI18nMap = {
    custom_fee: "@@TRANSACTION_FEES",
  };
  private _initFormData() {
    return {
      custom_fee: this.appSetting.settings.default_fee,
    };
  }
  @FeeInputPage.willEnter
  initData() {
    const current_fee = this.navParams.get("current_fee");
    if (isFinite(current_fee)) {
      if (!this.check_custom_fee(current_fee)) {
        this.formData.custom_fee = current_fee.toFixed(8);
      }
    }
  }

  @FeeInputPage.setErrorTo("errors", "custom_fee", [
    "NoBalance",
    "NoEnoughBalance",
    "ErrorRange",
  ])
  check_custom_fee(fee = this.formData.custom_fee) {
    // const user_balance = parseFloat(this.userInfo.balance) / 1e8;
    const custom_fee = parseFloat(fee);
    // if (user_balance === 0) {
    //   return {
    //     NoBalance: "@@USER_HAS_NO_BALANCE",
    //   };
    // }
    // if (custom_fee > user_balance) {
    //   return {
    //     NoEnoughBalance: "@@USER_HAS_NO_ENOUGH_BALANCE",
    //   };
    // }
    if (custom_fee < 0.00000001) {
      return {
        ErrorRange: "@@TOO_LITTLE_FEE",
      };
    }
  }

  submitData() {
    const formData = {
      ...this.formData,
      custom_fee: this.formData.custom_fee,
    };
    this.viewCtrl.dismiss(formData);
  }
}
