import { Component, Optional, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { sleep } from "../../../bnqkl-framework/PromiseExtends";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular/index";
import { PeerServiceProvider, LocalPeerModel } from "../../../providers/peer-service/peer-service";
import { AppSettingProvider } from "../../../providers/app-setting/app-setting";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { baseConfig } from "../../../bnqkl-framework/helper";

@IonicPage({ name: "account-peer-list" })
@Component({
  selector: "page-account-peer-list",
  templateUrl: "account-peer-list.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountPeerListPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public peerService: PeerServiceProvider,
    public cdRef: ChangeDetectorRef
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  get origin() {
    return baseConfig.SERVER_URL;
  }
  @AccountPeerListPage.markForCheck cur_peer_list: LocalPeerModel[] = [];
  private _cur_peer_map = new Map<string, LocalPeerModel>();
  @AccountPeerListPage.willEnter
  @asyncCtrlGenerator.loading()
  async initPeerList() {
    this.cur_peer_list = await this.peerService.getPeersLocal({ magic: this.baseConfig.MAGIC });
    this.cur_peer_list.map(peer => {
      this._cur_peer_map.set(peer.origin, peer);
    });
    if (sessionStorage.getItem("STOP_UPDATE_PEER_LIST") !== "true") {
      sessionStorage.setItem("STOP_UPDATE_PEER_LIST", "true");
      // 更新节点信息
      this.loopUpdatePeerList();
    }
  }

  private is_fetching_symbol = Symbol.for("fetching");
  isFetching(peer) {
    return peer[this.is_fetching_symbol];
  }
  private fetching_progress_symbol = Symbol.for("progress");
  getFetchingProgress(peer) {
    return peer[this.fetching_progress_symbol] * 100;
  }

  /**节点信息变动触发函数*/
  private _watchPeerInfoFetching({ peer, total_tasks_num, finished_num }) {
    const cur_peer = this.cur_peer_list.find(p => p.origin === peer.origin); // this._cur_peer_map.get(peer.origin);
    if (!cur_peer) {
      return;
    }
    const progress = finished_num / total_tasks_num;
    console.log(cur_peer.origin, progress);
    cur_peer[this.fetching_progress_symbol] = progress;
    cur_peer[this.is_fetching_symbol] = true;
    this.markForCheck();
    if (progress === 1) {
      setTimeout(() => {
        cur_peer[this.is_fetching_symbol] = false;
        this.markForCheck();
      }, 1250);
    }
  }

  @AccountPeerListPage.didLeave
  rm_watchPeerInfoFetching() {
    this.event.off("fetch-peers-info", this._watchPeerInfoFetching);
  }

  @asyncCtrlGenerator.success("节点信息刷新完成")
  async loopUpdatePeerList() {
    const min_wait_time = sleep(5000); // 至少每5秒要更新一次数据
    this._watchPeerInfoFetching = this._watchPeerInfoFetching.bind(this);
    this.event.on("fetch-peers-info", this._watchPeerInfoFetching);
    for await (var _pi of this.peerService.updateUseablePeersInfo(this.cur_peer_list, this.event)) {
      if (this.PAGE_STATUS >= this.PAGE_STATUS_ENUM.WILL_LEAVE) {
        break;
      }
      this.markForCheck();
    }
    await min_wait_time;
    // this.loopUpdatePeerList();
  }

  async forceTogglePeer(peer: LocalPeerModel) {
    if (
      await this.waitTipDialogConfirm(`确定要切换到这个节点(${peer.ip})？`, {
        false_text: "@@CANCEL",
        true_text: "@@OK",
      })
    ) {
      return this.peerService.linkPeer(peer);
    }
  }

  @asyncCtrlGenerator.tttttap({ times: 1 })
  @asyncCtrlGenerator.success("开始刷新节点信息")
  async tryForceRefresh() {
    this.loopUpdatePeerList();
  }
}
