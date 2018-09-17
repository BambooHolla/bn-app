import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { sleep, PromiseType } from "../../bnqkl-framework/PromiseExtends";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { FLP_Tool } from "../../bnqkl-framework/FLP_Tool";
import { baseConfig, getSocketIOInstance } from "../../bnqkl-framework/helper";
import { MainPage } from "../pages";
import {
  PeerServiceProvider,
  LocalPeerModel,
  PEER_LEVEL,
} from "../../providers/peer-service/peer-service";
import {
  BlockServiceProvider,
  BlockModel,
} from "../../providers/block-service/block-service";
import {
  AppSettingProvider,
  AppUrl,
} from "../../providers/app-setting/app-setting";
import { AppFetchProvider } from "../../providers/app-fetch/app-fetch";
import { AniBase, Easing } from "../../components/AniBase";
import { PeerRadarScanningComponent } from "../../components/peer-radar-scanning/peer-radar-scanning";
import * as IFM from "ifmchain-ibt";
import { MyApp } from "../../app/app.component";
import { LoginPage } from "../pages";

enum PAGE {
  scan = "scan-peer",
  link = "link-peer",
}

@IonicPage({ name: "scan-link-peer" })
@Component({
  selector: "page-scan-link-peer",
  templateUrl: "scan-link-peer.html",
})
export class ScanLinkPeerPage extends FirstLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public peerService: PeerServiceProvider,
    public cdRef: ChangeDetectorRef,
    public eleRef: ElementRef,
    public blockService: BlockServiceProvider,
    public appFetch: AppFetchProvider,
    public myapp: MyApp
  ) {
    super(navCtrl, navParams);
  }
  PAGE = PAGE;
  @ScanLinkPeerPage.markForCheck page_status = PAGE.scan;

  @asyncCtrlGenerator.tttttap()
  forceGoInSignInPage() {
    return this.myapp.openPage(LoginPage, true, "强制进入");
  }

  @ViewChild(PeerRadarScanningComponent)
  peerRadarScanning!: PeerRadarScanningComponent;
  @ScanLinkPeerPage.willEnter
  startPeerRadarScanning() {
    this.peerRadarScanning.startAnimation();
  }
  @ScanLinkPeerPage.markForCheck peer_list: LocalPeerModel[] = [];
  all_second_trust_peer_list: LocalPeerModel[] = [];
  get peer_host_list() {
    return this.peer_list.map(p => p.ip);
  }
  peer_searcher!: ReturnType<
    typeof PeerServiceProvider.prototype.searchAndCheckPeers
  >;
  calced_magic_peers_list: PromiseType<
    ReturnType<typeof PeerServiceProvider.prototype.calcPeersMagic>
  > = [];

  @ScanLinkPeerPage.willEnter
  @asyncCtrlGenerator.single()
  @asyncCtrlGenerator.error()
  async scanNodes() {
    // 至少要在这个界面上扫描3秒
    const min_time_lock = sleep(3000);

    do {
      /// 计算节点列表的magic，如果有多个，就让用户手动选择
      const calced_magic_peers_list = await this.peerService.calcPeersMagic();
      this.calced_magic_peers_list = calced_magic_peers_list;
      if (calced_magic_peers_list.length === 0) {
        throw new Error("@@THE_ENTER_PORT_PEERS_IS_NOT_AVAILABLE");
        const is_route_set_net = await this.waitTipDialogConfirm(
          "@@THE_ENTER_PORT_PEERS_IS_NOT_AVAILABLE",
          {
            false_text: "@@RETRY",
            true_text: "@@YES",
          }
        );
        if (is_route_set_net) {
          return this.routeTo("settings-net-version");
        }
      } else {
        if (calced_magic_peers_list.length > 1) {
          this.peerService.peerList = await this.selectEnterPortPeersListByMagic();
        }
        break;
      }
    } while (true);

    /// 开始搜索并计算节点
    this.peer_searcher = this.peerService.searchAndCheckPeers({
      manual_check_peers: true, // 手动控制检查节点：先关闭节点检查，全力搜索节点，等够了，在开始节点检查
    });
    /**获取所有次信任节点，目前规则为：必须扫描出所有的次信任节点才能进行下一步*/
    this.all_second_trust_peer_list = await this.peerService.getAllSecondTrustPeers();
    const levelMap: any = {};
    // 开始请求节点延迟信息
    do {
      // 这里不能用for await，否则下面break的时候，会导致迭代器中断
      const peer_searcher_iter = await this.peer_searcher.next();
      if (peer_searcher_iter.done) {
        break;
      }
      const peer_searcher_res = peer_searcher_iter.value;
      if ("height" in peer_searcher_res) {
        // this._calcPeerPos(peer_searcher_res);
        this.peer_list.push(peer_searcher_res);
        this.markForCheck();
        levelMap[peer_searcher_res.level] =
          (levelMap[peer_searcher_res.level] | 0) + 1;
        if (
          this.isEnableStartCheckPeers(
            levelMap,
            this.all_second_trust_peer_list
          )
        ) {
          break;
        }
      } else if ("search_done" in peer_searcher_res) {
        break;
      }
    } while (true);

    await min_time_lock;
    this.gotoLinkNodes();
  }

  /**从多个入口列表中选择一个
   * TODO: 使用弹出界面的方式，让用户自己手动选择，如果以后有多个入口的话
   */
  async selectEnterPortPeersListByMagic() {
    return this.calced_magic_peers_list[0].peers;
  }

  /*判断是否可以开始检查节点了*/
  isEnableStartCheckPeers(
    levelMap: any,
    all_second_trust_peer_list: LocalPeerModel[] = []
  ) {
    // if(levelMap[PEER_LEVEL.TRUST]){}
    const second_peer_num = Math.max(all_second_trust_peer_list.length, 4);
    return (
      levelMap[PEER_LEVEL.SEC_TRUST] >= second_peer_num ||
      levelMap[PEER_LEVEL.OTHER] >= 57
    );
  }
  /*进如到共识界面*/
  gotoLinkNodes() {
    // return this.routeTo(
    //   "link-node",
    //   {
    //     peer_searcher: this.peer_searcher,
    //     peer_list: this.peer_list,
    //     all_second_trust_peer_list: this.all_second_trust_peer_list,
    //   },
    //   {
    //     animation: "wp-transition",
    //   }
    // );
    this.page_status = PAGE.link;
    setTimeout(() => {
      this.peerRadarScanning.stopAnimation();
      this.getNodes();
    }, 800);
  }

  /*
 *
 *
 */

  @ScanLinkPeerPage.markForCheck use_offline_mode = false;
  @ScanLinkPeerPage.markForCheck useable_peers: LocalPeerModel[] = [];

  // peer_list:PeerModel[]
  // @ScanLinkPeerPage.willEnter
  @asyncCtrlGenerator.error()
  async getNodes() {
    var calc_res_list:
      | ReturnType<typeof PeerServiceProvider.calcPeers>
      | undefined;
    /*这个界面至少等待3s*/
    const min_search_time = sleep(3000);

    // const peer_searcher = this.navParams.get("peer_searcher"); // 搜索器
    // const peer_list = this.navParams.get("peer_list"); // 已经搜索到的节点
    // const all_second_trust_peer_list = this.navParams.get(
    //   "all_second_trust_peer_list"
    // ); // 所有的次信任节点

    const {
      peer_searcher, // 搜索器
      peer_list, // 已经搜索到的节点
      all_second_trust_peer_list, // 所有的次信任节点
    } = this;
    if (!peer_searcher) {
      return this.navCtrl.goToRoot({});
    }
    this.peer_searcher = peer_searcher;
    this.peer_list = peer_list;
    const peer_list_map = new Map<string, LocalPeerModel>();
    this.peer_list.forEach(p => peer_list_map.set(p.origin, p));
    this.markForCheck();
    // 使用搜索器继续搜索并开始执行节点检查
    console.log("使用搜索器继续搜索并开始执行节点检查");
    const peer_searcher_res = await this.peer_searcher.next(true);
    // console.log("peer_searcher_res", peer_searcher_res);
    const peer_info_list = [] as PromiseType<
      ReturnType<typeof PeerServiceProvider.prototype._checkPeer>
    >[];
    for await (var _pi of this.peer_searcher) {
      if ("peer" in _pi) {
        // 如果节点可用
        const checked_peer_info = _pi;
        // 滚动到这个节点
        this.scrollIntoView(checked_peer_info.peer);
        await sleep(100);
        const peer = peer_list_map.get(checked_peer_info.peer.origin);
        if (!peer) {
          this.peer_list.push(checked_peer_info.peer);
        } else if (peer !== checked_peer_info.peer) {
          Object.assign(peer, checked_peer_info.peer);
        }
        this.markForCheck();

        if (checked_peer_info.peer.disabled) {
          continue;
        }
        /*拜占庭检测可连接的节点*/
        peer_info_list.push(checked_peer_info);
        const check_res = PeerServiceProvider.calcPeers(
          peer_info_list,
          all_second_trust_peer_list
        );
        calc_res_list = check_res;
        // 随机进行选择
        const random_select_seed = Math.random();

        console.log("CR", check_res, random_select_seed);
        let acc_random = 0;
        for (var check_item of check_res) {
          acc_random += check_item.rate;
          if (random_select_seed < acc_random) {
            const selectable_peer_list = check_item.peer_info_list
              .sort(
                (a, b) =>
                  b.highest_blocks[0].height - a.highest_blocks[0].height
              )
              .filter((p, i, l) => {
                return (
                  p.highest_blocks[0].height === l[0].highest_blocks[0].height
                );
              });
            /// 最短延迟方案
            const min_delay_peer = selectable_peer_list.sort(
              (a, b) => a.peer.delay - b.peer.delay
            )[0];
            this.selected_peer = min_delay_peer.peer;
            this.selected_peer_highest_blocks = min_delay_peer.highest_blocks;
            this.scrollSelectedPeerIntoView();

            /*

            /// 方差方案

            const random_select_peer_seed = Math.random();
            // 算方差
            const pingjunzhi =
              selectable_peer_list.reduce(
                (a, p) => a + p.peer.delay,
                0
              ) / selectable_peer_list.length;
            var total_s = 0;
            var max_s = -Infinity;
            var min_s = Infinity;
            const s_list = ([] = selectable_peer_list.map(p => {
              const s = Math.pow(p.peer.delay - pingjunzhi, 2);
              total_s += s;
              max_s = Math.max(max_s, s);
              min_s = Math.min(min_s, s);
              return s;
            }));
            const mm_s = max_s + min_s;
            const s_rate_list = s_list
              .map((s, i) => {
                return {
                  rate: (mm_s - s) / total_s || 1,
                  pi: selectable_peer_list[i],
                };
              })
              .sort((a, b) => {
                // 概率高的放前面
                return b.rate - a.rate;
              });
            var random_r = Math.random();
            var acc_r = 0;
            const selected_s_rate = s_rate_list.find(s_rate => {
              acc_r += s_rate.rate;
              // console.log("random_r,acc_r", random_r, acc_r);
              return random_r <= acc_r;
            });
            if (selected_s_rate) {
              this.selected_peer = selected_s_rate.pi.peer;
              this.selected_peer_highest_blocks =
                selected_s_rate.pi.highest_blocks;
              this.scrollSelectedPeerIntoView();
            }*/

            // this.selected_peer =
            //   selectable_peer_list[
            //     (selectable_peer_list.length * Math.random()) | 0
            //   ].peer;
            break;
          }
        }
      }
    }

    await min_search_time;

    this.is_scaning_finish = true;
    // 已经搜索完了
    if (!this.selected_peer) {
      // console.warn("没有可信任的节点");
      // throw new Error("没有可信任的节点");
      if (peer_info_list.length) {
        // 切换手动选择
        this.toggleCanSelectByMyself();
      } else {
        this.use_offline_mode = true;
      }
    } else {
      calc_res_list && this.storeUseablePeers(calc_res_list);
      this.linkSelectedNode();
    }
  }

  @ScanLinkPeerPage.markForCheck can_select_by_myself = false;
  @asyncCtrlGenerator.tttttap()
  @asyncCtrlGenerator.success("能选了")
  async toggleCanSelectByMyself() {
    this.can_select_by_myself = !this.can_select_by_myself;
  }

  // formData = {
  //   selected_node_id: "",
  // };
  @ScanLinkPeerPage.markForCheck selected_peer?: LocalPeerModel;
  selected_peer_highest_blocks: BlockModel[] = [];
  selectNode(node: LocalPeerModel) {
    if (this.can_select_by_myself) {
      if (node.delay > 0) {
        this.selected_peer = node;
        this.markForCheck();
      }
    }
  }
  hideIp(ipv4) {
    const ipinfo = ipv4.split(".");
    if (ipinfo.length == 4) {
      ipinfo.splice(1, 2, "⁎⁎");
    }
    return ipinfo.join(".");
  }

  timeoutAutoLinkFastetNode() {
    if (this.selected_peer) {
      return;
    }
    const fastet_node = this.peer_list
      .filter(node => node.delay > 0)
      .sort((a, b) => a.delay - b.delay)[0];
    if (fastet_node) {
      this.selected_peer = fastet_node;
      this.linkNode(fastet_node);
    }
  }

  linkSelectedNode() {
    if (this.selected_peer) {
      this.linkNode(this.selected_peer);
    }
  }

  scrollSelectedPeerIntoView() {
    // const pageEle: HTMLElement = this.eleRef.nativeElement;
    // const selectedPeerEle = pageEle.querySelector("input:checked");
    // if (selectedPeerEle) {
    //   selectedPeerEle.scrollIntoView({ behavior: "smooth", block: "center" });
    // }
    this.selected_peer &&
      this.scrollIntoView(this.selected_peer, 1200, Easing.Quadratic_Out);
  }

  storeUseablePeers(
    calc_res_list: ReturnType<typeof PeerServiceProvider.calcPeers>
  ) {
    this.useable_peers = [];
    calc_res_list.forEach(check_item => {
      check_item.peer_info_list.forEach(peer_info => {
        this.useable_peers.push(peer_info.peer);
      });
    });
  }

  is_scaning_finish = false;

  @asyncCtrlGenerator.single()
  @asyncCtrlGenerator.loading("@@LINKING_PEER_NODE")
  @asyncCtrlGenerator.error("@@LINK_PEER_NODE_ERROR")
  async linkNode(peer: LocalPeerModel) {
    /*保存节点*/
    await Promise.all(
      this.peer_list.map(async peer => {
        if (
          !(await this.peerService.peerDb.has({
            origin: peer.origin,
          }))
        ) {
          return this.peerService.peerDb.insert(peer).catch(console.error);
        } else {
          return this.peerService.peerDb
            .update(
              {
                origin: peer.origin,
              },
              peer
            )
            .catch(console.error);
        }
      })
    );
    /*保存最高区块信息*/
    await Promise.all(
      this.selected_peer_highest_blocks.map(async block => {
        if (!(await this.blockService.blockDb.has({ id: block.id }))) {
          this.blockService.blockDb.insert(block).catch(console.error);
        }
      })
    );
    /// 尝试连接节点
    await this.peerService.linkPeer(peer);
    return this.myapp.openPage(this.myapp.tryInPage, true, false);
  }

  useAppWithOffLineMode() {
    return this.myapp.openPage(this.myapp.tryInPage, true, false);
  }

  private _scroll_peer?: Function;
  private _scroll_abort?: Function;
  /**滚动到指定节点对应的DOM元素*/
  scrollIntoView(peer: LocalPeerModel, ani_time = 250, easing?) {
    const ele = document.querySelector(
      `[data-origin="${peer.origin}"]`
    ) as HTMLElement;
    if (ele) {
      if (this._scroll_abort) {
        this._scroll_abort();
      }
      const parentEle = ele.parentElement as HTMLElement;
      const scrollToTop =
        ele.offsetTop -
        parentEle.offsetTop -
        parentEle.clientHeight / 2 +
        ele.clientHeight;
      AniBase.animateNumber(parentEle.scrollTop, scrollToTop, ani_time, easing)(
        (v, abort) => {
          parentEle.scrollTop = v;
          this._scroll_abort = abort;
        },
        () => {
          this._scroll_abort = undefined;
        }
      );
    }
  }
}
