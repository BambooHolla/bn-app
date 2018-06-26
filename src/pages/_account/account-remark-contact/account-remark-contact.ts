import { Component, Optional } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
} from "ionic-angular";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
// import { AccountServiceProvider } from "../../../providers/account-service/account-service";
import {
  ContactServiceProvider,
  ContactModel,
  ContactProModel,
  ContactGroupList,
  ContactGroupItem,
} from "../../../providers/contact-service/contact-service";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";

@IonicPage({ name: "account-remark-contact" })
@Component({
  selector: "page-account-remark-contact",
  templateUrl: "account-remark-contact.html",
})
export class AccountRemarkContactPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    // public accountService: AccountServiceProvider,
    public contactService: ContactServiceProvider,
    public viewCtrl: ViewController,
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  contact!: ContactProModel;

  @AccountRemarkContactPage.willEnter
  initData() {
    this.contact = this.navParams.get("contact");
    if (!this.contact) {
      return this.navCtrl.goToRoot({});
    }
  }
}
