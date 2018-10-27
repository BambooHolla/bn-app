import { Component, Optional, ChangeDetectorRef, ChangeDetectionStrategy } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { sleep } from "../../../bnqkl-framework/PromiseExtends";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular/index";
import { MinServiceProvider, DelegateModel } from "../../../providers/min-service/min-service";
import { PeerServiceProvider, LocalPeerModel } from "../../../providers/peer-service/peer-service";

@IonicPage({ name: "account-miner-list" })
@Component({
  selector: "page-account-miner-list",
  templateUrl: "account-miner-list.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountMinerListPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public minService: MinServiceProvider,
    public cdRef: ChangeDetectorRef,
    public peerService: PeerServiceProvider
  ) {
    super(navCtrl, navParams, true, tabs);
    this.auto_header_shadow_when_scroll_down = true;
  }
  @AccountMinerListPage.markForCheck cur_minter_rank_list?: DelegateModel[];
  @AccountMinerListPage.markForCheck can_minter_rank_list?: DelegateModel[];
  get show_cur_minter_rank_list() {
    return this.cur_minter_rank_list ? this.cur_minter_rank_list.slice(0, 4) : [];
  }
  get show_can_minter_rank_list() {
    return this.can_minter_rank_list ? this.can_minter_rank_list.slice(0, 4) : [];
  }

  // @AccountMinerListPage.willEnter
  async initMinterList() {
    const cur_minter_list = await this.minService.allMinersCurRound.getPromise();

    this.cur_minter_rank_list = cur_minter_list.map((cur_minter, i) => {
      return {
        No: i + 1,
        ...cur_minter,
      };
    });

    const can_minter_list = await this.minService.minersOut.getPromise();
    this.can_minter_rank_list = can_minter_list.map((can_minter, i) => {
      return {
        No: i + (cur_minter_list.length + 1),
        ...can_minter,
      };
    });
    // 更新页面
    this.cdRef.markForCheck();
  }
  @AccountMinerListPage.addEvent("ROUND:CHANGED")
  @asyncCtrlGenerator.error("@@LOAD_ACCOUNT_MINER_LIST_AND_PEER_ERROR")
  @asyncCtrlGenerator.retry()
  async watchRoundChange(height) {
    return this.initMinterList();
  }

  // @AccountMinerListPage.markForCheck cur_peer_list: LocalPeerModel[] = [];
  // @AccountMinerListPage.willEnter
  // async initPeerList() {
  //   this.cur_peer_list = this.peerService.useablePeers();
  //   // 更新节点信息
  //   return this.loopUpdatePeerList();
  // }
  // async loopUpdatePeerList() {
  //   const min_wait_time = sleep(5000); // 至少每5秒要更新一次数据
  //   // 更新节点信息
  //   for await (var _pi of this.peerService.updateUseablePeersInfo(
  //     this.cur_peer_list,
  //   )) {
  //     if (this.PAGE_STATUS <= this.PAGE_STATUS_ENUM.WILL_LEAVE) {
  //       break;
  //     }
  //     this.markForCheck();
  //   }
  //   await min_wait_time;
  //   this.loopUpdatePeerList();
  // }
}
