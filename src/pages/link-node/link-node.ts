import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
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
} from "../../providers/peer-service/peer-service";
import {
  BlockServiceProvider,
  BlockModel,
} from "../../providers/block-service/block-service";
import { AppSettingProvider } from "../../providers/app-setting/app-setting";
import { AppFetchProvider } from "../../providers/app-fetch/app-fetch";
import { AniBase, Easing } from "../../components/AniBase";
import * as IFM from "ifmchain-ibt";
import { MyApp } from "../../app/app.component";

@IonicPage({ name: "link-node" })
@Component({
  selector: "page-link-node",
  templateUrl: "link-node.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkNodePage extends FirstLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public peerService: PeerServiceProvider,
    public cdRef: ChangeDetectorRef,
    public eleRef: ElementRef,
    public blockService: BlockServiceProvider,
    public appFetch: AppFetchProvider,
    public myapp: MyApp,
  ) {
    super(navCtrl, navParams);
  }
  @LinkNodePage.markForCheck use_offline_mode = false;
  @LinkNodePage.markForCheck peer_list: LocalPeerModel[] = [];
  @LinkNodePage.markForCheck useable_peers: LocalPeerModel[] = [];

  peer_searcher!: ReturnType<
    typeof PeerServiceProvider.prototype.searchAndCheckPeers
  >;
  // peer_list:PeerModel[]
  @LinkNodePage.willEnter
  @asyncCtrlGenerator.error()
  async getNodes() {
    var calc_res_list:
      | ReturnType<typeof PeerServiceProvider.calcPeers>
      | undefined;
    /*这个界面至少等待3s*/
    const min_search_time = sleep(3000);
    min_search_time.then(() => {
      if (this.selected_peer) {
        this.linkSelectedNode();
      }
    });

    const peer_searcher = this.navParams.get("peer_searcher"); // 搜索器
    const peer_list = this.navParams.get("peer_list"); // 已经搜索到的节点
    const all_second_trust_peer_list = this.navParams.get(
      "all_second_trust_peer_list",
    ); // 所有的次信任节点
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
          all_second_trust_peer_list,
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
                  b.highest_blocks[0].height - a.highest_blocks[0].height,
              )
              .filter((p, i, l) => {
                return (
                  p.highest_blocks[0].height === l[0].highest_blocks[0].height
                );
              });

            const random_select_peer_seed = Math.random();
            // 算方差
            const pingjunzhi =
              selectable_peer_list.reduce((a, p) => a + p.peer.delay, 0) /
              selectable_peer_list.length;
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
            }

            // this.selected_peer =
            //   selectable_peer_list[
            //     (selectable_peer_list.length * Math.random()) | 0
            //   ].peer;
            break;
          }
        }
      }
    }

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

  @LinkNodePage.markForCheck can_select_by_myself = false;
  @asyncCtrlGenerator.tttttap()
  @asyncCtrlGenerator.success("能选了")
  async toggleCanSelectByMyself() {
    this.can_select_by_myself = !this.can_select_by_myself;
  }

  // formData = {
  //   selected_node_id: "",
  // };
  @LinkNodePage.markForCheck selected_peer?: LocalPeerModel;
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
    calc_res_list: ReturnType<typeof PeerServiceProvider.calcPeers>,
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
  @asyncCtrlGenerator.loading(LinkNodePage.getTranslate("LINKING_PEER_NODE"))
  @asyncCtrlGenerator.error(LinkNodePage.getTranslate("LINK_PEER_NODE_ERROR"))
  async linkNode(peer: LocalPeerModel) {
    /*保存节点*/
    await Promise.all(
      this.peer_list.map(async peer => {
        if (!(await this.peerService.peerDb.has({ origin: peer.origin }))) {
          this.peerService.peerDb.insert(peer).catch(console.error);
        }
      }),
    );
    /*保存最高区块信息*/
    await Promise.all(
      this.selected_peer_highest_blocks.map(async block => {
        if (!(await this.blockService.blockDb.has({ id: block.id }))) {
          this.blockService.blockDb.insert(block).catch(console.error);
        }
      }),
    );

    // await sleep(500);
    localStorage.setItem("SERVER_URL", peer.origin);
    const BLOCK_UNIT_TIME = peer.netInterval * 1000 || 128000;
    localStorage.setItem("BLOCK_UNIT_TIME", `${BLOCK_UNIT_TIME}`);
    localStorage.setItem("NET_VERSION", peer.netVersion || "mainnet");
    sessionStorage.setItem("LINK_PEER", "true");
    this.peerService.useablePeers(this.useable_peers);

    // 保存这次检测完成的时间，为了避免过度频繁的检测
    localStorage.setItem("LINK_PEER", Date.now().toString());
    // location.hash = "";
    // location.reload();

    if (
      baseConfig.NET_VERSION !== peer.netVersion ||
      AppSettingProvider.BLOCK_UNIT_TIME != baseConfig.BLOCK_UNIT_TIME
    ) {
      location.hash = "";
      location.reload();
      return;
    }
    // 只支持url动态重载
    if (baseConfig.SERVER_URL !== peer.origin) {
      baseConfig.SERVER_URL = peer.origin;
      AppSettingProvider.SERVER_URL = baseConfig.SERVER_URL;
      // 重新初始化io
      this.blockService.io.disconnect();
      delete this.blockService["_io"];
      this.blockService.bindIOBlockChange();
      FLP_Tool.webio = getSocketIOInstance(baseConfig.SERVER_URL, "/web");
      this.appFetch.webio = getSocketIOInstance(baseConfig.SERVER_URL, "/web");
    }
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
      `[data-origin="${peer.origin}"]`,
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
        },
      );
    }
  }
}
