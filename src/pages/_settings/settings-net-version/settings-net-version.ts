import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { AppSettingProvider } from "../../../providers/app-setting/app-setting";

@IonicPage({ name: "settings-net-version" })
@Component({
  selector: "page-settings-net-version",
  templateUrl: "settings-net-version.html",
})
export class SettingsNetVersionPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  get net_version() {
    return AppSettingProvider.NET_VERSION;
  }
  async changeNetVersion(net_version) {
    if (this.net_version === net_version) {
      return;
    }
    if (net_version !== "testnet" && net_version !== "mainnet") {
      return;
    }
    return this.alertCtrl
      .create({
        title: await this.getTranslate("APP_WILL_RESTART"),
        buttons: [
          {
            text: await this.getTranslate("CANCEL"),
          },
          {
            text: await this.getTranslate("OK"),
            handler: () => this._changeNetVersion(net_version),
          },
        ],
      })
      .present();
  }
  private _changeNetVersion(net_version: string) {
    if (net_version == "testnet") {
      localStorage.setItem("NET_VERSION", net_version);
      localStorage.setItem(
        "SERVER_HOST",
        "FULL:http://test1.ifmchain.org:19002",
      );
    } else if (net_version == "mainnet") {
      localStorage.removeItem("NET_VERSION");
      localStorage.removeItem("SERVER_HOST");
    } else {
      return;
    }
    location.reload();
  }
}
