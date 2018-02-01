import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";

@IonicPage({ name: "settings-set-default-fee" })
@Component({
  selector: 'page-settings-set-default-fee',
  templateUrl: 'settings-set-default-fee.html',
})
export class SettingsSetDefaultFeePage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  formData = {
    default_fee: "0.00000001"
  }
  @SettingsSetDefaultFeePage.setErrorTo("errors", "default_fee", ["wrongRange"])
  check_defalutFee() {
    const { default_fee } = this.formData;
    const num = parseFloat(default_fee);
    if (!isFinite(num) || num <= 0) {
      return {
        wrongRange: true
      }
    }
  }
  @asyncCtrlGenerator.success(() => SettingsSetDefaultFeePage.getTranslate("DEFAULT_FEE_SET_SUCCESS"))
  async submit() {
    this.appSetting.settings.default_fee = this.formData.default_fee + "";
    this.finishJob();
  }
}
