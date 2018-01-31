import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
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
  ) {
    super(navCtrl, navParams, true, tabs);
  }

  formData = {
    search_text: "",
  };

  private _ti;
  searchContacts() {
    clearTimeout(this._ti);
    this._ti = setTimeout(() => {
      this.getUserPassword()
        .then(pwdData => {
          const { password, pay_pwd } = pwdData;
          this._searchContacts(password, pay_pwd);
        })
        .catch(() => {
          /*密码设置异常不做处理*/
        });
    }, 200);
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
  private async _searchContacts(password, pay_pwd) {
    // 直接添加，暂时不支持搜索
    const address = this.formData.search_text;
    const is_success = await this.contactService.addContact(
      password,
      address,
      pay_pwd,
    );
  }
}
