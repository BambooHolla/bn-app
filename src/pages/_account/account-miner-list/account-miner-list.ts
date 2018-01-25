import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";

@IonicPage({ name: "account-miner-list" })
@Component({
	selector: "page-account-miner-list",
	templateUrl: "account-miner-list.html",
})
export class AccountMinerListPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
	) {
		super(navCtrl, navParams, true, tabs);
		this.auto_header_shadow_when_scroll_down = true;
	}
	cur_minter_rank_list: any[];
	can_minter_rank_list: any[];
	get show_cur_minter_rank_list() {
		return this.cur_minter_rank_list
			? this.cur_minter_rank_list.slice(0, 4)
			: [];
	}
	get show_can_minter_rank_list() {
		return this.can_minter_rank_list
			? this.can_minter_rank_list.slice(0, 4)
			: [];
	}

	cur_peer_list: any[];

	@AccountMinerListPage.willEnter
	async initMinterList() {
		await new Promise(cb => setTimeout(cb, 1000));
		this.cur_minter_rank_list = Array.from(Array(57)).map((_, i) => ({
			No: i + 1,
		}));
		this.can_minter_rank_list = Array.from(Array(20)).map((_, i) => ({
			No: i + 1,
		}));
		await new Promise(cb => setTimeout(cb, 500));
		this.cur_peer_list = Array.from(
			Array((Math.random() * 20) | 0),
		).map((_, i) => {
			return {
				id: i,
				ip: Array.from({ length: 4 })
					.map(() => (256 * Math.random()) | 0)
					.join("."),
				height: parseInt(
					new Date()
						.toDateString()
						.match(/\d+/g)
						.join(""),
				),
				ping: 0,
				linked_number: (Math.random() * 50) | 0,
				port: 8080,
			};
		});
	}
}
