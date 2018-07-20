import {
	Component,
	ViewChild,
	ElementRef,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
} from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { ChainMeshComponent } from "../../components/chain-mesh/chain-mesh";
import {
	PeerServiceProvider,
	LocalPeerModel,
	PEER_LEVEL,
} from "../../providers/peer-service/peer-service";
import { NetworkInterface } from "@ionic-native/network-interface";

@IonicPage({ name: "scan-peers" })
@Component({
	selector: "page-scan-peers",
	templateUrl: "scan-peers.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanPeersPage extends FirstLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		public peerService: PeerServiceProvider,
		public networkInterface: NetworkInterface,
		public cdRef: ChangeDetectorRef,
	) {
		super(navCtrl, navParams);
	}
	@ScanPeersPage.markForCheck peer_list: LocalPeerModel[] = [];
	get peer_host_list() {
		return this.peer_list.map(p => p.ip);
	}
	peer_searcher?: ReturnType<
		typeof PeerServiceProvider.prototype.searchAndCheckPeers
	>;
	@ScanPeersPage.willEnter
	async scanNodes() {
		this.peer_searcher = this.peerService.searchAndCheckPeers({
			manual_check_peers: true, // 手动控制检查节点：先关闭节点检查，全力搜索节点，等够了，在开始节点检查
		});
		const levelMap: any = {};
		// 开始请求节点延迟信息
		for await (var _r of this.peer_searcher) {
			if ("height" in _r) {
				// this._calcPeerPos(_r);
				this.peer_list.push(_r);
				this.markForCheck();
				levelMap[_r.level] = (levelMap[_r.level] | 0) + 1;
				if (this.isEnableStartCheckPeers(levelMap)) {
					break;
				}
			} else if ("search_done" in _r) {
				break;
			}
		}
		// this.gotoLinkNodes();
	}
	/*判断是否可以开始检查节点了*/
	isEnableStartCheckPeers(levelMap: any) {
		return (
			levelMap[PEER_LEVEL.SEC_TRUST] >= 4 ||
			levelMap[PEER_LEVEL.OTHER] >= 57
		);
	}
	/*进如到共识界面*/
	gotoLinkNodes() {
		return this.routeTo(
			"link-node",
			{
				peer_searcher: this.peer_searcher,
				peer_list: this.peer_list,
			},
			{
				animation: "wp-transition",
			},
		);
	}
}
