import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";

@IonicPage({ name: "tab-chain" })
@Component({
	selector: "page-tab-chain",
	templateUrl: "tab-chain.html",
})
export class TabChainPage extends FirstLevelPage {
	constructor(public navCtrl: NavController, public navParams: NavParams) {
		super(navCtrl, navParams);
	}
	block_list = Array.from(Array(10))
		.map((_, i) => {
			return {
				reward: 200 * Math.random(),
				height: i,
				is_delay: Math.random() > 0.5,
				trans_num: (Math.random() * 5000) | 0,
				trans_assets: Math.random() * 10000,
				fee: 5000 * Math.random() * 0.00000001,
			};
		})
		.reverse();
	unconfirm_block_mesh_thit = 0xa4a2a3;

	unconfirm_block = {
		reward: 200 * Math.random(),
		height: this.block_list.length,
		is_delay: Math.random() > 0.5,
		trans_num: (Math.random() * 5000) | 0,
		trans_assets: Math.random() * 10000,
		fee: 5000 * Math.random() * 0.00000001,
	};
}
