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

@IonicPage({ name: "account-contact-detail" })
@Component({
  selector: "page-account-contact-detail",
  templateUrl: "account-contact-detail.html",
})
export class AccountContactDetailPage extends SecondLevelPage {
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
  contact?: ContactProModel;

  @AccountContactDetailPage.willEnter
  initData() {
    this.contact = this.navParams.get("contact");
    if (!this.contact) {
      return this.navCtrl.goToRoot({});
    }
  }

  get mainname() {
    const { contact } = this;
    if (contact) {
      return contact.remarkname || contact.username;
    }
  }
  get nickname() {
    const { contact } = this;
    if (contact && contact.remarkname) {
      return contact.username;
    }
  }
}
