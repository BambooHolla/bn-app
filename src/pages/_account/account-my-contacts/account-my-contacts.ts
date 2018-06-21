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
  ContactGroupList,
  ContactGroupItem,
} from "../../../providers/contact-service/contact-service";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";

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
    // public accountService: AccountServiceProvider,
    public contactService: ContactServiceProvider,
    public viewCtrl: ViewController,
  ) {
    super(navCtrl, navParams, true, tabs);
    // this.auto_header_shadow_when_scroll_down = true;
  }
  get search_placeholder() {
    if (this.loading_my_contact_list) {
      if (this.my_contact_list.length == 0) {
        return this.getTranslateSync("NO_CONTACT");
      } else {
        return this.getTranslateSync("SEARCH_#NUM#_CONTACTS", {
          num: this.my_contact_list.length,
        });
      }
    } else {
      return this.getTranslateSync("LOADING_CONTACT");
    }
  }

  hide_unconfirm_contact_list = false;
  toggleUnconfirmContactList() {
    this.hide_unconfirm_contact_list = !this.hide_unconfirm_contact_list;
  }
  unconfirm_contact_list: ContactModel[] = [];
  confirmed_contact_list: ContactModel[] = [];
  my_contact_list: ContactGroupList = [];
  listTrackBy(item, contact: ContactModel) {
    return contact.address;
  }
  loading_my_contact_list = false;
  // @AccountMyContactsPage.willEnter
  async loadMyContactList() {
    this.loading_my_contact_list = true;
    const contact_parser = this.contactService.contactModelDiffParser;
    try {
      const {
        following: confirmed_contact_list,
        follower: unconfirm_contact_list,
      } = await this.contactService.myContact.getPromise();
      // 绑定未确认的联系人
      if (
        this.isArrayDiff(
          this.unconfirm_contact_list,
          unconfirm_contact_list,
          contact_parser,
        )
      ) {
        this.unconfirm_contact_list = unconfirm_contact_list;
      }
      if (
        this.isArrayDiff(
          this.confirmed_contact_list,
          confirmed_contact_list,
          contact_parser,
        )
      ) {
        this.confirmed_contact_list = confirmed_contact_list;
        // 将已有的联系人进行分组
        const grouped_contact = this.contactService.contactGroup(
          confirmed_contact_list,
        );
        this.my_contact_list = grouped_contact;
      }
    } finally {
      this.loading_my_contact_list = false;
    }
  }
  ignoreUnconfirmContact(contact: ContactModel) {
    this.showConfirmDialog(
      "@@CONFIRM_TO_IGNORE_THIS_CONTACT",
      () => {
        this._ignoreUnconfirmContact(contact);
      },
      undefined,
      true,
    );
  }
  @asyncCtrlGenerator.error(() =>
    AccountMyContactsPage.getTranslate("IGNORE_UNCONFIRM_CONTACT_ERROR"),
  )
  private _ignoreUnconfirmContact(contact: ContactModel) {
    return this.contactService.ignoreContact(contact.address);
  }
  @asyncCtrlGenerator.error()
  async addUnconfirmContact(contact: ContactModel) {
    const { password, pay_pwd, custom_fee } = await this.getUserPassword({
      title: "@@ADD_UNCONFIRM_CONTACT_TITLE",
      custom_fee: true,
    });
    return this._addUnconfirmContact(
      password,
      contact.address,
      pay_pwd,
      custom_fee,
    );
  }
  @asyncCtrlGenerator.error()
  async removeConfirmedContact(contact: ContactModel) {
    const { password, pay_pwd, custom_fee } = await this.getUserPassword({
      title: "@@REMOVE_CONFIRMED_CONTACT_TITLE",
      custom_fee: true,
    });
    return this._removeConfirmedContact(
      password,
      contact.address,
      pay_pwd,
      custom_fee,
    );
  }
  @asyncCtrlGenerator.error(() =>
    AccountMyContactsPage.getTranslate("ADD_CONTACT_SUBMIT_ERROR"),
  )
  @asyncCtrlGenerator.loading(() =>
    AccountMyContactsPage.getTranslate("ADD_CONTACT_SUBMITING"),
  )
  @asyncCtrlGenerator.success(() =>
    AccountMyContactsPage.getTranslate("ADD_CONTACT_SUBMIT_SUCCESS"),
  )
  async _addUnconfirmContact(
    password: string,
    address: string,
    pay_pwd?: string,
    custom_fee?: number,
  ) {
    return this.contactService.addContact(
      password,
      address,
      pay_pwd,
      custom_fee,
    );
  }
  @asyncCtrlGenerator.error(() =>
    AccountMyContactsPage.getTranslate("REMOVE_CONTACT_SUBMIT_ERROR"),
  )
  @asyncCtrlGenerator.loading(() =>
    AccountMyContactsPage.getTranslate("REMOVE_CONTACT_SUBMITING"),
  )
  @asyncCtrlGenerator.success(() =>
    AccountMyContactsPage.getTranslate("REMOVE_CONTACT_SUBMIT_SUCCESS"),
  )
  async _removeConfirmedContact(
    password: string,
    address: string,
    pay_pwd?: string,
    custom_fee?: number,
  ) {
    return this.contactService.addContact(
      password,
      address,
      pay_pwd,
      custom_fee,
      "-",
    );
  }

  confirmToDelete(concat: ContactModel) {
    this.showConfirmDialog(
      this.getTranslateSync("CONFIRM_TO_REMOVE_CONTACT"),
      () => {
        this.removeConfirmedContact(concat);
      },
    );
  }
  private _deleteContact(contact: ContactModel) {
    this.contactService;
  }

  // TODO: 这个页面不根据高度实时刷新，因为可能是一个大列表
  @AccountMyContactsPage.addEvent("HEIGHT:CHANGED")
  @asyncCtrlGenerator.error(
    "更新联系人列表失败，重试次数过多，已停止重试，请检测网络",
  )
  @asyncCtrlGenerator.retry()
  watchHeightChanged() {
    return this.loadMyContactList();
  }
}
