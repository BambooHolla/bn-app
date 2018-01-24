import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";

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
	) {
		super(navCtrl, navParams, true, tabs);
	}

	account_info = {
		username: undefined,
		address: "b7LA11Tgg3HNiAD6rJMDpD44y3V4WGNX8R",
	};
}
