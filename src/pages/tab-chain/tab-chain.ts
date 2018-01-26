import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { BlockServiceProvider } from "../../providers/block-service/block-service";

@IonicPage({ name: "tab-chain" })
@Component({
	selector: "page-tab-chain",
	templateUrl: "tab-chain.html",
})
export class TabChainPage extends FirstLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		public blockService: BlockServiceProvider,
	) {
		super(navCtrl, navParams);
		this.auto_header_shadow_when_scroll_down = true;
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
	block_list_config = {
		pageSize: 20,
	};

	@TabChainPage.willEnter
	async loadBlockList() {
		const block_list = await this.blockService.getTopBlocks(
			false,
			this.block_list_config.pageSize,
		);
		console.log("block_list", block_list);
		this.block_list = block_list.map(block => {
			return {
				reward: parseFloat(block.reward) / 1e8,
				height: block.height,
				is_delay: false,
				trans_num: block.numberOfTransactions,
				trans_assets: parseFloat(block.totalAmount) / 1e8,
				fee: parseFloat(block.totalFee) / 1e8,
			};
		});
	}
}
