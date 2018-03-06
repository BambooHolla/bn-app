import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
} from "ionic-angular";
import { UserInfoProvider } from "../../../providers/user-info/user-info";
import { ContactServiceProvider } from "../../../providers/contact-service/contact-service";

@IonicPage({ name: "account-add-contact" })
@Component({
  selector: "page-account-add-contact",
  templateUrl: "account-add-contact.html",
})
export class AccountAddContactPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public user: UserInfoProvider,
    public contactService: ContactServiceProvider,
    public viewCtrl: ViewController,
  ) {
    super(navCtrl, navParams, true, tabs);
  }

  formData = {
    search_text: "",
  };
  showCloseButton = false;
  closeModal() {
    this.viewCtrl.dismiss();
  }

  @AccountAddContactPage.willEnter
  autoAddContact() {
    this.showCloseButton = this.navParams.get("showCloseButton");
    const address = this.navParams.get("address");
    if (address) {
      this.formData.search_text = address;
      if (this.navParams.get("auto_search")) {
        this.searchContacts(0);
      }
    }
  }

  private _ti;
  searchContacts(t = 200) {
    clearTimeout(this._ti);
    this._ti = setTimeout(() => {
      this.getUserPassword({
        custom_fee: true,
      })
        .then(pwdData => {
          const { password, pay_pwd, custom_fee } = pwdData;
          this._searchContacts(password, pay_pwd, custom_fee);
        })
        .catch(() => {
          /*密码设置异常不做处理*/
        });
    }, t);
  }

  // get canSubmit() {
  //   const address = this.formData.search_text;
  //   return super.canSubmit ;//&& address.length === 32;
  // }
  @asyncCtrlGenerator.error(() =>
    AccountAddContactPage.getTranslate("ADD_CONTACT_ERROR"),
  )
  @asyncCtrlGenerator.success(() =>
    AccountAddContactPage.getTranslate("ADD_CONTACT_SUCCESS"),
  )
  private async _searchContacts(password, pay_pwd, custom_fee?: number) {
    // 直接添加，暂时不支持搜索
    const address = this.formData.search_text;
    const is_success = await this.contactService.addContact(
      password,
      address,
      pay_pwd,
      custom_fee,
    );
    this.finishJob();
  }
}
