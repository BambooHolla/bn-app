import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
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
    const BLOCK_UNIT_TIME =
      parseFloat(localStorage.getItem("BLOCK_UNIT_TIME") || "") / 1000;
    if (BLOCK_UNIT_TIME) {
      return AppSettingProvider.NET_VERSION + BLOCK_UNIT_TIME;
    }
    return AppSettingProvider.NET_VERSION;
  }
  async changeNetVersion(net_version) {
    if (this.net_version === net_version) {
      return;
    }
    if (
      net_version !== "testnet" &&
      net_version !== "mainnet" &&
      net_version !== "testnet128"
    ) {
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
      localStorage.removeItem("BLOCK_UNIT_TIME");
    } else if (net_version == "mainnet") {
      localStorage.removeItem("NET_VERSION");
      localStorage.removeItem("SERVER_HOST");
      localStorage.removeItem("BLOCK_UNIT_TIME");
    } else if (net_version === "testnet128") {
      localStorage.setItem("NET_VERSION", "testnet");
      localStorage.setItem("BLOCK_UNIT_TIME", "" + 128e3);
      localStorage.setItem("SERVER_HOST", "FULL:http://35.194.190.61:19000");
    } else {
      return;
    }
    this._clearDigRound();
    this._reloadApp();
  }
  @asyncCtrlGenerator.loading()
  private async _reloadApp() {
    this.navCtrl.goToRoot({});
    location.hash = "";
    location.reload();
  }

  private _clearDigRound() {
    for (var key in localStorage) {
      if (key.startsWith("SETTING@digRound:")) {
        localStorage.removeItem("key");
      }
    }
  }

  tap_times = 0;
  per_tap_time = 0;
  trySuperImportLS() {
    const cur_tap_time = Date.now();
    if (cur_tap_time - this.per_tap_time > 500) {
      // 两次点击的间隔不能多余半秒，否则重置计数
      this.tap_times = 0;
    }
    this.per_tap_time = cur_tap_time;
    this.tap_times += 1;
    if (this.tap_times === 5) {
      const ls_json = prompt("请输入配置");
      if (ls_json) {
        try {
          const ls = JSON.parse(ls_json);
          window["importLS"](ls);
          this._reloadApp();
        } catch (err) {
          alert("配置失败：" + err.message);
        }
      }
    }
  }
}
