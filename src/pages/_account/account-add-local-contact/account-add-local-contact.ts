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
import { LocalContactProvider } from "../../../providers/local-contact/local-contact";

@IonicPage({ name: "account-add-local-contact" })
@Component({
	selector: "page-account-add-local-contact",
	templateUrl: "account-add-local-contact.html",
})
export class AccountAddLocalContactPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public user: UserInfoProvider,
		public localContact: LocalContactProvider,
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

	@AccountAddLocalContactPage.willEnter
	autoAddContact() {
		this.showCloseButton = this.navParams.get("showCloseButton");
		const address = this.navParams.get("address");
		if (address) {
			this.formData.search_text = address;
			if (this.navParams.get("auto_search")) {
				this.addContacts();
			}
		}
	}

	adding_contact = false;

	@asyncCtrlGenerator.error("@@ADD_LOCAL_CONTACT_ERROR")
	@asyncCtrlGenerator.success("@@ADD_LOCAL_CONTACT_SUCCESS")
	@asyncCtrlGenerator.loading()
	@asyncCtrlGenerator.single({ lock_prop_key: "adding_contact" })
	async addContacts() {
		const address_or_username = this.formData.search_text;
		if (address_or_username === this.userInfo.address) {
			throw new Error("@@COULD_NOT_ADD_SELF_AS_CONTACT");
		}
		const searched_contact = await this.localContact.searchContact(
			address_or_username,
		);
		if (!searched_contact) {
			throw new Error("@@ACCOUNT_NO_FOUND");
		}
		if (searched_contact.address === this.userInfo.address) {
			throw new Error("@@COULD_NOT_ADD_SELF_AS_CONTACT");
		}
		// 直接添加，暂时不支持搜索
		const new_contact_id = await this.localContact.addLocalContact(
			searched_contact,
		);
		this.jobRes({ new_contact_id });
		this.finishJob();
	}
}
