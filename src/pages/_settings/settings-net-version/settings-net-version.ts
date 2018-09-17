import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { AppSettingProvider } from "../../../providers/app-setting/app-setting";
import { getLatestVersionInfo } from "../../tab-account/checkUpdate";
import { AppFetchProvider } from "../../../providers/app-fetch/app-fetch";
import { PeerServiceProvider } from "../../../providers/peer-service/peer-service";
import { PEER_INFO } from "../../version-update-dialog/version.types";

type PEER_INFO_WITH_VERSION = PEER_INFO & {
  net_version: string;
};

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
    public fetch: AppFetchProvider,
    public peerService: PeerServiceProvider
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  private _net_version?: string;
  get net_version() {
    if (!this._net_version) {
      this._net_version = `${AppSettingProvider.NET_VERSION}|${
        AppSettingProvider.SERVER_URL
      }|${AppSettingProvider.BLOCK_UNIT_TIME}`;
    }
    return this._net_version;
  }
  peerToNetVersion(peer: PEER_INFO) {
    return `${peer.config.NET_VERSION}|${peer.config.SERVER_URL}|${
      peer.config.BLOCK_UNIT_TIME
    }`;
  }
  default_peer_list: PEER_INFO_WITH_VERSION[] = this.formatPeerList([
    {
      title: "mainnet",
      config: {
        SERVER_URL: "http://publish.ifmchain.org",
        NET_VERSION: "mainnet",
        BLOCK_UNIT_TIME: 128000,
      },
    },
  ]);
  formatPeerList(peer_list: PEER_INFO[]): PEER_INFO_WITH_VERSION[] {
    return peer_list.map(peer =>
      Object.assign(peer, { net_version: this.peerToNetVersion(peer) })
    );
  }
  peer_list: PEER_INFO_WITH_VERSION[] = [];
  @SettingsNetVersionPage.willEnter
  async loadPeerList() {
    // 先读取本地缓存的
    const ls_peer_list_json = localStorage.getItem("PEER_LIST");
    try {
      if (ls_peer_list_json) {
        var ls_peer_list = JSON.parse(ls_peer_list_json);
      }
    } catch (err) {}
    if (!ls_peer_list) {
    }
    // 或者直接拿默认配置的
    this.peer_list = ls_peer_list || this.default_peer_list.slice();
    // 在从网络上下载最新的配置并缓存
    const config = await getLatestVersionInfo(
      this.fetch,
      this.translate.currentLang
    );
    if (config && config.peer_list) {
      this.peer_list = this.formatPeerList(config.peer_list);
      // 保存到缓存中
      localStorage.setItem("PEER_LIST", JSON.stringify(this.peer_list));
    }
  }

  async changeNetVersion(peer: PEER_INFO_WITH_VERSION) {
    if (this.net_version === peer.net_version) {
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
            text: await this.getTranslate("CONFIRM"),
            handler: () => {
              this._changeNetVersion(peer);
            },
          },
        ],
      })
      .present();
  }
  @asyncCtrlGenerator.single()
  @asyncCtrlGenerator.loading()
  @asyncCtrlGenerator.error()
  private async _changeNetVersion(net_version: PEER_INFO) {
    localStorage.removeItem("LINK_PEER");
    sessionStorage.removeItem("LINK_PEER");
    if (net_version.config.NET_VERSION === "mainnet") {
      localStorage.removeItem("PEERS");
    } else {
      const aNode = document.createElement("a");
      aNode.href = net_version.config.SERVER_URL;
      const { magic, sourceIp } = await this.peerService.fetchPeerMagic(
        net_version.config.SERVER_URL
      );
      localStorage.setItem("sourceIp", sourceIp);

      localStorage.setItem(
        "PEERS",
        JSON.stringify([
          {
            origin: net_version.config.SERVER_URL,
            level: 1,
            webChannelLinkNum: 0,
            netVersion: net_version.config.NET_VERSION,
            netInterval: 10,
            ip: aNode.hostname,
            height: 0,
            p2pPort: 19000,
            magic,
            webPort: 19002,
            delay: -1,
            acc_use_duration: 0,
            latest_verify_fail_time: 0,
            acc_verify_total_times: 0,
            acc_verify_success_times: 0,
          },
        ])
      );
    }
    this._importLS(net_version.config);
  }

  private _importLS(config) {
    window["importLS"](config);
    this._clearDigRound();
    this._reloadApp();
  }

  @asyncCtrlGenerator.loading()
  private async _reloadApp() {
    this.navCtrl.goToRoot({});
    setTimeout(() => {
      location.hash = "";
      location.reload();
    }, 500);
  }

  private _clearDigRound() {
    for (var key in localStorage) {
      if (key.startsWith("SETTING@digRound:")) {
        localStorage.removeItem("key");
      }
    }
  }

  @asyncCtrlGenerator.tttttap()
  trySuperImportLS() {
    let ls_json = prompt("请输入配置");
    if (ls_json) {
      try {
        const try_adds = ls_json.split(".");
        if (
          try_adds.length <= 4 &&
          try_adds.every(add => parseInt(add).toString() == add)
        ) {
          const footer_adds = Array(3)
            .concat(try_adds)
            .slice(-4);
          const adds = "192.168.16."
            .split(".")
            .map((add, i) => footer_adds[i] || add);
          ls_json = `{"LATEST_APP_VERSION_URL": "http://${adds.join(
            "."
          )}:8180/api/app/version/latest"}`;
        }
        const ls = JSON.parse(ls_json);
        this._importLS(ls);
      } catch (err) {
        alert("配置失败：" + err.message);
      }
    }
  }
}
