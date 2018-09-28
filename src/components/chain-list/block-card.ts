import * as PIXI from "pixi.js";
import * as PIXI_Filters from "pixi-filters";
import { FLP_Tool } from "../../bnqkl-framework/FLP_Tool";
import { afCtrl } from "../../bnqkl-framework/helper";
import { TranslateService } from "@ngx-translate/core";
import {
	BlockModel,
	BlockServiceProvider,
} from "../../providers/block-service/block-service";
import { getLabelWidth, commonFontFamily, iconFontFamily } from "./helper";
import { AniBase, ifmicon_font_ready } from "../AniBase";

export class BlockCard extends PIXI.Graphics {
	@FLP_Tool.FromGlobal translate!: TranslateService;
	chain_height!: number;
	block?: BlockModel | Promise<BlockModel>;
	static bg_resource: PIXI.Texture;
	get bg_resource() {
		return (this.constructor as typeof BlockCard).bg_resource;
	}
	private _label_config = {
		height: "\ue674 高度",
		tran_num: "\ue604 交易量",
		total_amount: "\ue629 总数量",
		total_fee: "\ue67a 手续费",
		view_block_detail: "查看区块",
		view_block_detail_icon: "\ue600",
	};
	private _can_tap = false;
	setTapAble(can_tap: boolean) {
		this._can_tap = can_tap;
		this.setCacheAsBitmap(!can_tap);
		this.interactive = can_tap;
		if (can_tap) {
			// 刷新显示
			this.toggleFooterContainerMask();
		} else {
			// 取消点击
			this.toggleFooterContainerMask(false);
		}
	}
	get label_config() {
		return this._label_config;
	}
	set label_config(v) {
		Object.assign(this._label_config, v);
		this.drawLabels();
	}
	constructor(
		public W: number,
		public H: number,
		chain_height: number,
		block?: BlockModel | Promise<BlockModel>
	) {
		super();
		// console.log("NNNNNN");
		this.beginFill(0xffffff, 0);
		this.drawRect(0, 0, W, H);
		this.endFill();
		const { shadown } = this;

		// init shadown
		// {
		//   const bg = new PIXI.Sprite(this.bg_resource);
		//   bg.width = W;
		//   bg.scale.y = bg.scale.x;
		//   shadown.addChild(bg);
		//   this.addChild(shadown);
		// }
		{
			const s_w = this.width * 0.92;
			const s_h = this.height * 0.92;
			const s_l = (this.width - s_w) / 2;
			const s_t = (this.height - s_h) / 2;
			const bg = new PIXI.Sprite(this.bg_resource);
			const bg_size_rate = bg.width / bg.height;
			bg.width = s_w;
			bg.height = s_h;
			bg.x = s_l;
			bg.y = s_t;
			shadown.addChild(bg);
			// const glow_filter = new PIXI.filters.GlowFilter();
			const shadow_filter = new PIXI.filters.DropShadowFilter();
			shadow_filter.alpha = 0.2;
			shadow_filter.blur = W * 0.005 * 2;
			shadow_filter.rotation = 90;
			shadow_filter.quality = 5;
			shadow_filter.distance = W * 0.01;
			// shadow_filter.shadowOnly = true;
			shadow_filter.color = 0x0;
			this.shadow_filter = shadow_filter;

			this.addChild(shadown);
		}

		// init child
		this.addChild(this.height_content);
		this.addChild(this.height_label);
		this.addChild(this.tran_num_content);
		this.addChild(this.tran_num_label);
		this.addChild(this.total_amount_label);
		this.addChild(this.total_amount_content);
		this.addChild(this.total_fee_label);
		this.addChild(this.total_fee_content);

		this.addChild(this.footer_container);
		this.interactive = true;
		this.on("pointerdown", () => {
			this.toggleFooterContainerMask(true);
			this.emit("refresh-frame-in-async");
		});
		this.on("pointerup", () => {
			// 可能被取消
			this.toggleFooterContainerMask(false);
			this.emit("refresh-frame-in-async");
		});
		this.on("pointertap", () => {
			this.emit("click-footer", this.chain_height, this.block);
		});
		this.footer_container.addChild(this.view_block_detail_label);
		this.footer_container.addChild(this.view_block_detail_label_icon);
		// 尝试绘制
		this.updateBlockModel(chain_height, block);
		// this.drawLabels();

		this.translate
			.stream([
				"HEIGHT",
				"TRANSACTION_AMOUNT",
				"TOTALAMOUNT",
				"FEE",
				"CHECK_BLOCK",
			])
			.subscribe(values => {
				const label_config = {
					height: "\ue674 " + values["HEIGHT"],
					tran_num: "\ue604 " + values["TRANSACTION_AMOUNT"],
					total_amount: "\ue629 " + values["TOTALAMOUNT"],
					total_fee: "\ue67a " + values["FEE"],
					view_block_detail: values["CHECK_BLOCK"],
					view_block_detail_icon: "\ue600",
				};
				this.label_config = label_config;
				this.emit("refresh-frame-in-async");
			});
	}
	private _show_footer_container_mask = true;
	toggleFooterContainerMask(show = this._show_footer_container_mask) {
		this._show_footer_container_mask = show;
		const is_show = show && this.interactive;

		if (is_show) {
			if (!this.filters || this.filters.length !== 1) {
				// this.filters = [this.shadow_filter];
			}
		} else {
			this.filters = null;
		}
	}
	shadown = new PIXI.Graphics();

	get style_header_content() {
		const { W } = this;
		return {
			fill: 0x7b7b7b,
			fontSize: W * 0.075,
			fontFamily: commonFontFamily.slice(),
			padding: W * 0.05,
			fontWeight: "500",
			wordWrap: true,
			wordWrapWidth: W * 0.25,
			align: "center",
		};
	}
	get style_header_label() {
		const { W } = this;
		return {
			fill: [0x66d5fa, 0x67f0e4],
			fontSize: W * 0.04,
			fontFamily: iconFontFamily.slice(),
			padding: W * 0.04,
		};
	}
	get style_detail_label() {
		const { W } = this;
		return {
			fill: 0x7b7b7b,
			fontSize: W * 0.038,
			fontFamily: iconFontFamily.slice(),
			padding: W * 0.038,
		};
	}
	get style_detail_content() {
		const { W } = this;
		return {
			...this.style_detail_label,
			fontFamily: commonFontFamily,
		};
	}
	get style_footer_label() {
		const { W } = this;
		return {
			fill: 0xffffff,
			fontSize: W * 0.038,
			fontFamily: iconFontFamily.slice(),
			padding: W * 0.038,
		};
	}
	get style_footer_label_icon() {
		const { W } = this;
		return {
			fill: 0xffffff,
			fontSize: W * 0.1,
			fontFamily: iconFontFamily.slice(),
			padding: W * 0.05,
		};
	}
	/*模拟 text-align: center*/
	private _textAlignCenter(
		text: PIXI.Text,
		vw: number,
		left_or_right: 1 | -1
	) {
		const { W } = this;
		const min_content_width = W * vw;
		if (text.width < min_content_width) {
			text.x += ((min_content_width - text.width) / 2) * left_or_right;
		}
	}
	shadow_filter: PIXI.filters.DropShadowFilter;
	height_content = new PIXI.Text("", this.style_header_content);
	tran_num_content = new PIXI.Text("", this.style_header_content);
	height_label = new PIXI.Text("", this.style_header_label);
	tran_num_label = new PIXI.Text("", this.style_header_label);
	total_amount_label = new PIXI.Text("", this.style_detail_label);
	total_amount_content = new PIXI.Text("", this.style_detail_content);
	total_fee_label = new PIXI.Text("", this.style_detail_label);
	total_fee_content = new PIXI.Text("", this.style_detail_content);

	footer_container = new PIXI.Container();
	view_block_detail_label = new PIXI.Text("", this.style_footer_label);
	view_block_detail_label_icon = new PIXI.Text(
		"",
		this.style_footer_label_icon
	);

	drawLabels() {
		this.setCacheAsBitmap(false);
		const {
			H,
			W,
			label_config,

			height_label,
			tran_num_label,
			total_amount_label,
			total_fee_label,

			footer_container,
			view_block_detail_label,
			view_block_detail_label_icon,
		} = this;

		const left_base_line = W * 0.075;
		const right_base_line = W * 0.92;
		{
			height_label.text = label_config.height;
			height_label.x = left_base_line;
			height_label.y = H * 0.32;
		}
		{
			tran_num_label.text = label_config.tran_num;
			tran_num_label.x = right_base_line - getLabelWidth(tran_num_label);
			tran_num_label.y = H * 0.32;
		}
		{
			total_amount_label.text = label_config.total_amount;
			total_amount_label.x = left_base_line;
			total_amount_label.y = H * 0.59;
		}
		{
			total_fee_label.text = label_config.total_fee;
			total_fee_label.x = left_base_line;
			total_fee_label.y = H * 0.69;
		}
		{
			const w = W * 0.92;
			const h = 0.183 * H * 0.9;
			const l = (W - w) / 2;
			const t = H * 0.955 - h;
			footer_container.x = l;
			footer_container.y = t;
			// footer_container.cacheAsBitmap = false;
			// 查看区块
			view_block_detail_label.text = label_config.view_block_detail;
			view_block_detail_label.y = (h - W * 0.038) / 2;
			view_block_detail_label.x =
				w * 0.48 - getLabelWidth(view_block_detail_label) / 2;
			// ->
			view_block_detail_label_icon.text =
				label_config.view_block_detail_icon;
			view_block_detail_label_icon.y = (h - W * 0.1) / 2;
			view_block_detail_label_icon.x =
				view_block_detail_label.x +
				getLabelWidth(view_block_detail_label) +
				w * 0.01;
			// footer_container.cacheAsBitmap = true;
			this.toggleFooterContainerMask(false);
		}

		this.setCacheAsBitmap(!this._can_tap);
	}
	private _checkRegisterDrawBlockModel = () => false;
	updateBlockModel(
		height: number,
		block: BlockModel | Promise<BlockModel> | undefined
	) {
		let no_same_height = height !== this.chain_height;
		if (no_same_height) {
			this.chain_height = height;
			this.drawHeightContent();
		}
		let need_redraw_block = no_same_height;
		if (!this.block && block) {
			need_redraw_block = true;
		} else if (this.block && !block) {
			need_redraw_block = true;
		}
		if (need_redraw_block) {
			this.block = block;
			if (block instanceof Promise) {
				this._checkRegisterDrawBlockModel = () => this.block === block;
				block.then(bm => {
					if (this.chain_height === bm.height && this.parent) {
						this.block = bm;
						this.drawBlockModel(bm);
						this.emit("refresh-frame-in-async");
					}
				});
				this.undrawBlockModel();
			} else if (block) {
				this.drawBlockModel(block);
			} else {
				this.undrawBlockModel();
			}
		}
	}
	drawHeightContent() {
		this.setCacheAsBitmap(false);
		const {
			H,
			W,
			block,

			height_content,
		} = this;

		height_content.text = this.chain_height + "";
		height_content.x = W * 0.075;
		height_content.y = H * 0.15;
		this._textAlignCenter(height_content, 0.16, 1);

		this.setCacheAsBitmap(!this._can_tap);
	}
	drawBlockModel(block: {
		numberOfTransactions: number | string;
		totalAmount: string;
		totalFee: string;
	}) {
		this.setCacheAsBitmap(false);
		const {
			H,
			W,

			tran_num_content,
			total_amount_content,
			total_fee_content,
		} = this;

		tran_num_content.visible = true;
		total_amount_content.visible = true;
		total_fee_content.visible = true;

		const right_base_line = W * 0.92;
		{
			tran_num_content.text = block.numberOfTransactions + "";
			tran_num_content.x = right_base_line - tran_num_content.width;
			tran_num_content.y = H * 0.15;
			this._textAlignCenter(tran_num_content, 0.16, -1);
		}
		{
			total_amount_content.text = AniBase.amountToString(
				block.totalAmount
			);
			total_amount_content.x =
				right_base_line - total_amount_content.width;
			total_amount_content.y = H * 0.59;
		}
		{
			total_fee_content.text = AniBase.amountToString(block.totalFee);
			total_fee_content.x = right_base_line - total_fee_content.width;
			total_fee_content.y = H * 0.69;
		}
		this.setCacheAsBitmap(!this._can_tap);
	}
	undrawBlockModel() {
		this.setCacheAsBitmap(false);
		const {
			H,
			W,

			tran_num_content,
			total_amount_content,
			total_fee_content,
		} = this;
		tran_num_content.visible = false;
		total_amount_content.visible = false;
		total_fee_content.visible = false;
		this.setCacheAsBitmap(!this._can_tap);
	}

	private _cache_as_bitmap_ti?: number;
	setCacheAsBitmap(v: boolean) {

	}
}
