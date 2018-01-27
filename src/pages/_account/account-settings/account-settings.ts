import { Component, Optional } from "@angular/core";
import { Config, IonicPage, NavController, NavParams } from "ionic-angular";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { AppSettingProvider } from "../../../providers/app-setting/app-setting";

@IonicPage({ name: "account-settings" })
@Component({
  selector: "page-account-settings",
  templateUrl: "account-settings.html",
})
export class AccountSettingsPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public ionicConfig: Config,
    @Optional() public tabs: TabsPage,
    public appSetting: AppSettingProvider,
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  auto_header_shadow_when_scroll_down = true;
}
