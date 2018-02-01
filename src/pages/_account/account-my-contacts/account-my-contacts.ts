import { Component, Optional } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { AccountServiceProvider } from "../../../providers/account-service/account-service";
import { ContactServiceProvider, ContactModel } from "../../../providers/contact-service/contact-service";
import * as pinyin from "tiny-pinyin";
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
    public accountService: AccountServiceProvider,
    public contactService: ContactServiceProvider,
  ) {
    super(navCtrl, navParams, true, tabs);
    this.auto_header_shadow_when_scroll_down = true;
  }
  unconfirm_contact_list: ContactModel[] = [];
  my_contact_list: ContactModel[] = [];
  loading_my_contact_list = false
  @AccountMyContactsPage.willEnter
  async loadMyContactList() {
    this.loading_my_contact_list = true
    try {
      const {
        following: my_contact_list,
        follower: unconfirm_contact_list,
      } = await this.contactService.getMyContacts();
      // 绑定未确认的联系人
      this.unconfirm_contact_list = unconfirm_contact_list;
      // 将已有的联系人进行分组
      const letter_list_map = new Map();
      const unkown_letter: { letter: string, list: ContactModel[] } = {
        letter: "*",
        list: [],
      };
      my_contact_list.forEach(my_contact => {
        if (!my_contact.username) {
          unkown_letter.list.push(my_contact);
          return;
        }
        try {
          const word = pinyin.convertToPinyin(my_contact.username[0]);
          if (!word) {
            unkown_letter.list.push(my_contact);
            return;
          }
          let letter = letter_list_map.get(word[0]);
          if (!letter) {
            letter = {
              letter: word[0],
              list: [],
            };
            letter_list_map.set(word[0], letter);
          }
          letter.list.push(my_contact);
        } catch {
          unkown_letter.list.push(my_contact);
        }
      });
      this.my_contact_list = [...letter_list_map.values()].sort((a, b) => {
        return a.letter.localeCompare(b.letter);
      });
    } finally {
      this.loading_my_contact_list = false
    }
  }
  @asyncCtrlGenerator.error(() => AccountMyContactsPage.getTranslate("IGNORE_UNCONFIRM_CONTACT_ERROR"))
  ignoreUnconfirmContact(contact: ContactModel) {
    return this.contactService.ignoreContact(contact.address)
  }
  @asyncCtrlGenerator.error()
  async addUnconfirmContact(contact: ContactModel) {
    const { password, pay_pwd } = await this.getUserPassword()
    return this._addUnconfirmContact(password, contact.address, pay_pwd)
  }
  @asyncCtrlGenerator.error(() => AccountMyContactsPage.getTranslate("ADD_CONTACT_SUBMIT_ERROR"))
  @asyncCtrlGenerator.loading(() => AccountMyContactsPage.getTranslate("ADD_CONTACT_SUBMITING"))
  @asyncCtrlGenerator.success(() => AccountMyContactsPage.getTranslate("ADD_CONTACT_SUBMIT_SUCCESS"))
  async _addUnconfirmContact(password: string, address: string, pay_pwd: string) {
    return this.contactService.addContact(password, address, pay_pwd);
  }
}
