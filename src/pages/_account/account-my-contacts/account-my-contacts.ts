import { Component, Optional } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { AccountServiceProvider } from "../../../providers/account-service/account-service";
import { ContactServiceProvider } from "../../../providers/contact-service/contact-service";
import * as pinyin from "tiny-pinyin";

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
  unconfirm_contact_list = Array.from(Array(3));
  my_contact_list = ["A", "B", "Y"].map(letter => {
    return {
      letter,
      list: Array.from(Array(10)),
    };
  });
  @AccountMyContactsPage.willEnter
  async loadMyContactList() {
    const {
      following: my_contact_list,
      follower: unconfirm_contact_list,
    } = await this.contactService.getMyContacts();
    const letter_list_map = new Map();
    const unkown_letter = {
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
        letter.push(my_contact);
      } catch {
        unkown_letter.list.push(my_contact);
      }
    });
    this.my_contact_list = [...letter_list_map.values()].sort((a, b) => {
      return a.letter.localeCompare(b.letter);
    });
  }
}
