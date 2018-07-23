import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { sleep } from "../../bnqkl-framework/PromiseExtends";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { MainPage } from "../pages";
import {
  PeerServiceProvider,
  LocalPeerModel,
} from "../../providers/peer-service/peer-service";

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
  ) {
    super(navCtrl, navParams);
  }
  peer_list: LocalPeerModel[] = [];
  peer_searcher!: ReturnType<
    typeof PeerServiceProvider.prototype.searchAndCheckPeers
  >;
  // peer_list:PeerModel[]
  @LinkNodePage.willEnter
  async getNodes() {
    /*这个界面至少等待3s*/
    const min_search_time = sleep(3000);
    min_search_time.then(() => {
      if (this.selected_peer) {
        this.linkSelectedNode();
      }
    });

    const peer_searcher = this.navParams.get("peer_searcher"); // 搜索器
    const peer_list = this.navParams.get("peer_list"); // 已经搜索到的节点
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
    console.log("peer_searcher_res", peer_searcher_res);
    const peer_info_list = [] as any[];
    for await (var _pi of this.peer_searcher) {
      console.log("PI", _pi);
      if ("peer" in _pi) {
        // 如果节点可用
        const checked_peer_info = _pi;
        const peer = peer_list_map.get(checked_peer_info.peer.origin);
        if (!peer) {
          this.peer_list.push(checked_peer_info.peer);
        } else if (peer !== checked_peer_info.peer) {
          Object.assign(peer, checked_peer_info.peer);
        }
        this.markForCheck();

        /*拜占庭检测可连接的节点*/
        peer_info_list.push(checked_peer_info);
        const check_res = PeerServiceProvider.calcPeers(peer_info_list);
        console.log("CR", check_res);
        // 随机进行选择
        const random_select_seed = Math.random();
        let acc_random = 0;
        for (var check_item of check_res) {
          acc_random += check_item.rate;
          if (random_select_seed < acc_random) {
            this.selected_peer = check_item.peer_info_list.sort(
              (a, b) => b.highest_blocks[0].height - a.highest_blocks[0].height,
            )[0].peer;
            break;
          }
        }
      }
    }

    // 已经搜索完了
    if (!this.selected_peer) {
      console.warn("没有可信任的节点");
    } else {
      await sleep(250);
      this.linkSelectedNode();
    }
  }

  can_select_by_myself = false;
  @asyncCtrlGenerator.tttttap()
  @asyncCtrlGenerator.success("能选了")
  toggleCanSelectByMyself() {
    this.can_select_by_myself = !this.can_select_by_myself;
  }

  // formData = {
  //   selected_node_id: "",
  // };
  @LinkNodePage.markForCheck selected_peer?: LocalPeerModel;
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

  @asyncCtrlGenerator.loading(LinkNodePage.getTranslate("LINKING_PEER_NODE"))
  @asyncCtrlGenerator.error(LinkNodePage.getTranslate("LINK_PEER_NODE_ERROR"))
  async linkNode(peer: LocalPeerModel) {
    await sleep(200);
    localStorage.setItem("SERVER_URL", peer.origin);
    sessionStorage.setItem("LINK_PEER", "true");
    location.hash = "";
    location.reload();
    // await new Promise(cb => setTimeout(cb, 600 * Math.random() + 200));
    // if (Math.random() > 0.5) {
    //   this.routeTo(MainPage);
    // } else {
    //   throw new Error("节点连接失败");
    // }
  }
}
