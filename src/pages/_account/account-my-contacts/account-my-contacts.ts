import { Component, Optional } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";

@IonicPage({ name: "account-my-contacts" })
@Component({
  selector: "page-account-my-contacts",
  templateUrl: "account-my-contacts.html",
})
export class AccountMyContactsPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
  ) {
    super(navCtrl, navParams, true, tabs);
    this.auto_header_shadow_when_scroll_down = true;
  }
  unconfirm_contact_list = Array.from(Array(3));
  my_contact_list = ["A", "B", "Y"].map(letter => {
    return {
      letter,
      list: Array.from(Array(10)),
    };
  });
}
