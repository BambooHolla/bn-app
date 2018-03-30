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

  @FeeInputPage.setErrorTo("errors", "custom_fee", ["ErrorRange"])
  check_custom_fee(fee = this.formData.custom_fee) {
    const custom_fee = parseFloat(fee);
    if (
      custom_fee < 0.00000001 ||
      custom_fee > parseFloat(this.userInfo.balance)
    ) {
      return {
        ErrorRange: true,
      };
    }
  }

  submitData() {
    const formData = {
      ...this.formData,
      custom_fee: parseFloat(this.formData.custom_fee),
    };
    this.viewCtrl.dismiss(formData);
  }
}
