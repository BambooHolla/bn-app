import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import {
	PeerServiceProvider,
	PeerModel,
} from "../../../providers/peer-service/peer-service";

@IonicPage({ name: "account-peer-list" })
@Component({
	selector: "page-account-peer-list",
	templateUrl: "account-peer-list.html",
})
export class AccountPeerListPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public peerService: PeerServiceProvider,
	) {
		super(navCtrl, navParams, true, tabs);
	}
	cur_peer_list?: PeerModel[];
	@AccountPeerListPage.willEnter
	async initPeerList() {
		await this.peerService.sortPeers(peer_list => {
			this.cur_peer_list = peer_list.map(peer => ({
				...peer,
				linked_number: (Math.random() * 50) | 0,
			}));
		});
	}
}
