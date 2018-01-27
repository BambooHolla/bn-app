import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";

@IonicPage({ name: "account-info" })
@Component({
  selector: "page-account-info",
  templateUrl: "account-info.html",
})
export class AccountInfoPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  account_info = {
    username: undefined,
    address: "b7LA11Tgg3HNiAD6rJMDpD44y3V4WGNX8R",
  };
}
