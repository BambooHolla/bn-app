import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
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
    // 开始执行节点检查
    this.peer_searcher.next(true);
    for await (var _pi of this.peer_searcher) {
      if ("peer" in _pi) {
        const checked_peer_info = _pi;
        const peer = peer_list_map.get(checked_peer_info.peer.origin);
        if (!peer) {
          this.peer_list.push(checked_peer_info.peer);
        } else if (peer !== checked_peer_info.peer) {
          Object.assign(peer, checked_peer_info.peer);
        }
        this.markForCheck();
      }
    }
  }

  formData = {
    selected_node_id: "",
  };
  selectNode(node: LocalPeerModel) {
    if (node.delay > 0) {
      this.formData.selected_node_id = node.origin;
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
    if (this.formData.selected_node_id) {
      return;
    }
    const fastet_node = this.peer_list
      .filter(node => node.delay > 0)
      .sort((a, b) => a.delay - b.delay)[0];
    if (fastet_node) {
      this.formData.selected_node_id = fastet_node.origin;
      this.linkNode(fastet_node);
    }
  }

  linkSelectedNode() {
    const selected_node = this.peer_list.find(
      node => node.origin === this.formData.selected_node_id,
    );
    if (selected_node) {
      this.linkNode(selected_node);
    }
  }

  @asyncCtrlGenerator.loading(LinkNodePage.getTranslate("LINKING_PEER_NODE"))
  @asyncCtrlGenerator.error(LinkNodePage.getTranslate("LINK_PEER_NODE_ERROR"))
  async linkNode(node) {
    await new Promise(cb => setTimeout(cb, 600 * Math.random() + 200));
    if (Math.random() > 0.5) {
      this.routeTo(MainPage);
    } else {
      throw new Error("节点连接失败");
    }
  }
}
