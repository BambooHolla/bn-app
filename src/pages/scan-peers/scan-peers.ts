import {
	Component,
	ViewChild,
	ElementRef,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
} from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { sleep } from "../../bnqkl-framework/PromiseExtends";
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
		// 至少要在这个界面上扫描3秒
		const min_time_lock = sleep(3000);

		this.peer_searcher = this.peerService.searchAndCheckPeers({
			manual_check_peers: true, // 手动控制检查节点：先关闭节点检查，全力搜索节点，等够了，在开始节点检查
		});
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
				if (this.isEnableStartCheckPeers(levelMap)) {
					break;
				}
			} else if ("search_done" in peer_searcher_res) {
				break;
			}
		} while (true);

		await min_time_lock;
		this.gotoLinkNodes();
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
