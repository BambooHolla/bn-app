import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { UserInfoProvider } from "../../providers/user-info/user-info";

// @IonicPage({ name: "tab-account" })
@Component({
  selector: "page-tab-account",
  templateUrl: "tab-account.html",
})
export class TabAccountPage extends FirstLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public user: UserInfoProvider,
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
}
