import { Component, Optional } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular/index";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";

@IonicPage({ name: "settings-sync-config" })
@Component({
	selector: "page-settings-sync-config",
	templateUrl: "settings-sync-config.html",
})
export class SettingsSyncConfigPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage
	) {
		super(navCtrl, navParams, true, tabs);
	}
}
