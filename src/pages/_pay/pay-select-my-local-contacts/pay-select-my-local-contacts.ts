import {
  Component,
  Optional,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
} from "ionic-angular";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { AccountServiceProvider } from "../../../providers/account-service/account-service";
import {
  LocalContactProvider,
  LocalContactModel,
  LocalContactGroupList,
} from "../../../providers/local-contact/local-contact";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";

@IonicPage({ name: "pay-select-my-local-contacts" })
@Component({
  selector: "page-pay-select-my-local-contacts",
  templateUrl: "pay-select-my-local-contacts.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaySelectMyLocalContactsPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public accountService: AccountServiceProvider,
    public localContact: LocalContactProvider,
    public viewCtrl: ViewController,
    public cdRef: ChangeDetectorRef
  ) {
    super(navCtrl, navParams, true, tabs);
    this.auto_header_shadow_when_scroll_down = true;
  }
  grouped_contact_list: LocalContactGroupList = [];
  contact_list: LocalContactModel[] = [];
  listTrackBy(item, contact: LocalContactModel) {
    return contact.address;
  }

  private _loading_my_contact_list = false;
  get loading_my_contact_list() {
    return this._loading_my_contact_list;
  }
  set loading_my_contact_list(v) {
    this._loading_my_contact_list = v;
    this.cdRef.markForCheck();
  }
  @PaySelectMyLocalContactsPage.willEnter
  async loadMyContactList() {
    this.loading_my_contact_list = true;
    try {
      const contacts = await this.localContact.getLocalContacts();
      this.contact_list = contacts;
      this.grouped_contact_list = this.localContact.contactGroup(contacts);
    } finally {
      this.loading_my_contact_list = false;
    }
  }

  /*点击联系人*/
  tapContact(contact: LocalContactModel) {
    const mode = this.navParams.get("mode");
    if (mode === "select-address") {
      this.jobRes(contact);
      this.finishJob();
    }
  }
}
