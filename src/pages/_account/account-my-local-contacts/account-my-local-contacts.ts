import {
  Component,
  Optional,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
} from "ionic-angular";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";

import {
  LocalContactModel,
  LocalContactProvider,
  LocalContactGroupItem,
  LocalContactGroupList,
  LocalContactGroupMethod,
} from "../../../providers/local-contact/local-contact";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";

@IonicPage({ name: "account-my-local-contacts" })
@Component({
  selector: "page-account-my-local-contacts",
  templateUrl: "account-my-local-contacts.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountMyLocalContactsPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    // public accountService: AccountServiceProvider,
    public localContactService: LocalContactProvider,
    public viewCtrl: ViewController,
    public cdRef: ChangeDetectorRef
  ) {
    super(navCtrl, navParams, true, tabs);
    // this.auto_header_shadow_when_scroll_down = true;
  }
  get search_placeholder() {
    if (!this.loading_my_contact_list) {
      if (this.grouped_contact_list.length == 0) {
        return this.getTranslateSync("NO_CONTACT");
      } else {
        return this.getTranslateSync("SEARCH_#NUM#_CONTACTS", {
          num: this.grouped_contact_list.length,
        });
      }
    } else {
      return this.getTranslateSync("LOADING_CONTACT");
    }
  }
  get list_placeholder() {
    if (!this.loading_my_contact_list) {
      if (this.grouped_contact_list.length == 0) {
        return this.getTranslateSync("NO_CONTACT");
      }
    } else {
      return this.getTranslateSync("LOADING_CONTACT");
    }
  }
  /*联系人列表*/
  contact_list: LocalContactModel[] = [];
  /*分组列表*/
  grouped_contact_list: LocalContactGroupList = [];
  listTrackBy(item, contact: LocalContactModel) {
    return contact.address;
  }
  private _loading_my_contact_list = false;
  get loading_my_contact_list() {
    return this._loading_my_contact_list;
  }
  set loading_my_contact_list(v) {
    this._loading_my_contact_list = v;
    this.markForCheck();
  }
  @AccountMyLocalContactsPage.willEnter
  async loadMyContactList() {
    this.loading_my_contact_list = true;
    try {
      const local_contacts = await this.localContactService.getLocalContacts();
      // 绑定未确认的联系人
      this.contact_list = local_contacts;
      this.grouped_contact_list = this.localContactService.contactGroup(
        local_contacts
      );
      this.markForCheck();
      this._updateMyContactInfo();
    } finally {
      this.loading_my_contact_list = false;
    }
  }

  /*联网更新联系人信息*/
  /*TODO: 实现订阅功能，在多线程里头订阅我的联系人的改名交易，从而实现更新数据库*/
  @AccountMyLocalContactsPage.addEvent("HEIGHT:CHANGED")
  private async _updateMyContactInfo() {
    const current_height = this.appSetting.getHeight();
    for (var _contact of this.contact_list) {
      const local_contact = _contact;
      if (
        !local_contact.username &&
        local_contact.last_update_height !== current_height
      ) {
        const account = await this.accountService.getAccountByAddress(
          local_contact.address
        );
        if (account.username) {
          local_contact.username = account.username;
        }
        await this.localContactService.updateLocaContact(local_contact);
      }
    }
  }

  @asyncCtrlGenerator.error("@@REMOVE_LOCAL_CONTACT_SUBMIT_ERROR")
  @asyncCtrlGenerator.loading("@@REMOVE_LOCAL_CONTACT_SUBMITING")
  @asyncCtrlGenerator.success("@@REMOVE_LOCAL_CONTACT_SUBMIT_SUCCESS")
  async removeLocalContact(local_contact: LocalContactModel) {
    await this.localContactService.removeLocalContact(local_contact._id);
    return this.loadMyContactList();
  }

  confirmToDelete(local_contact: LocalContactModel) {
    this.showConfirmDialog(
      this.getTranslateSync("CONFIRM_TO_REMOVE_LOCAL_CONTACT"),
      () => {
        this.removeLocalContact(local_contact);
      }
    );
  }

  exportContactsToQrcode() {
    const data = JSON.stringify(this.contact_list);
  }

  /*隐藏功能*/
  @asyncCtrlGenerator.tttttap()
  @asyncCtrlGenerator.loading("账户查询中")
  @asyncCtrlGenerator.error("账户查询失败")
  async tryShowUserBalance(address: string) {
    const account = await this.accountService.getAccountByAddress(address);
    await this.showSuccessDialog(
      (parseFloat(account.balance) / 1e8).toFixed(8)
    );
  }
}
