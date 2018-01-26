import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import {
	BlockServiceProvider,
	BlockModel,
} from "../../providers/block-service/block-service";

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
	unconfirm_block_mesh_thit = 0xa4a2a3;

	block_list: BlockModel[] = [];
	block_list_config = {
		page: 1,
		pageSize: 20,
		has_more: false,
	};

	unconfirm_block: BlockModel;
	@TabChainPage.willEnter
	async loadUnconfirmBlock() {
		// this.blockService
	}

	@TabChainPage.willEnter
	@asyncCtrlGenerator.error(() =>
		TabChainPage.getTranslate("LOAD_BLOCK_LIST_ERROR"),
	)
	@asyncCtrlGenerator.loading(() =>
		TabChainPage.getTranslate("LOADING_BLOCK_LIST"),
	)
	async loadBlockList() {
		const { block_list_config } = this;
		const block_list = await this.blockService.getTopBlocks(
			false,
			block_list_config.pageSize,
		);
		console.log("block_list", block_list);
		this.block_list = block_list;
		block_list_config.has_more =
			block_list.length == block_list_config.pageSize;

		// 根据返回的高度，对page进行重置
		const last_block = block_list[block_list.length - 1];
		if (last_block) {
			const height = last_block.height;
			block_list_config.page =
				Math.round(height / block_list_config.pageSize) + 1; // +1代表当前的页
		} else {
			block_list_config.page = 1;
		}
	}
	@asyncCtrlGenerator.error(() =>
		TabChainPage.getTranslate("LOAD_MORE_BLOCK_LIST_ERROR"),
	)
	async loadMoreBlockList() {
		const { block_list_config } = this;
		block_list_config.page -= 1;
		const block_list = await this.blockService.getBlocksByPage(
			block_list_config.page,
			block_list_config.pageSize,
		);
		block_list_config.has_more =
			block_list_config.pageSize == block_list.length;
		const last_block = this.block_list[this.block_list.length - 1];
		if (last_block) {
			// 过滤掉不需要的block，并从高到低排序
			var filtered_block_list = block_list
				.filter(block => {
					return block.height < last_block.height;
				})
				.sort((a, b) => {
					return b.height - a.height;
				});
		} else {
			console.error("已有的列表不可能为空！");
			filtered_block_list = block_list;
		}
		this.block_list.push(...filtered_block_list);
		if (
			filtered_block_list.length !== block_list.length &&
			filtered_block_list.length < block_list_config.pageSize / 2
		) {
			// 执行了过滤，需要加载更多的数据
			return this.loadMoreBlockList();
		}
	}
}
