import {
	Component,
	ViewChild,
	ElementRef,
	OnInit,
	AfterViewInit,
	OnDestroy,
	Input,
	Output,
	ChangeDetectionStrategy,
} from "@angular/core";
import { AniBase } from "../AniBase";
import { PromiseOut } from "../../bnqkl-framework/PromiseExtends";
import * as PIXI from "pixi.js";
import * as PIXI_Filters from "pixi-filters";
import { BlockModel, BlockServiceProvider } from '../../providers/block-service/block-service'
console.log("PIXI_Filters", PIXI_Filters, PIXI)
Object.assign(PIXI.filters, PIXI_Filters);

interface PlaceholderBlock extends BlockModel {
	placeholder: true;
}
const INDEX_SYMBOL = "__index__"; // Symbol.for("index");
const HEIGHT_SYMBOL = "__height__"; // Symbol.for("index");

type BlockItem = {
	block?: BlockModel | Promise<BlockModel>;
	chain_height: number;
	loading: boolean;
	y: number;
	cardView: BlockCard;
};

@Component({
	selector: 'chain-list',
	templateUrl: 'chain-list.html'
})
export class ChainListComponent extends AniBase {
	@ViewChild("canvas") canvasRef!: ElementRef;
	devicePixelRatio = Math.sqrt(window.devicePixelRatio);

	constructor(public blockService: BlockServiceProvider) {
		super();
		this.on("init-start", this.initPixiApp.bind(this));
	}

	_init() {
		const canvasNode: HTMLCanvasElement = this.canvasNode || (this.canvasNode = this.canvasRef.nativeElement);
		// this.ctx = this.canvasNode.getContext("2d");
		return super._init();
	}
	initPixiApp() {
		if (this.app) {
			this.app.stage.children.slice().forEach(child => {
				return child.destroy();
			});
			this._loop_runs.length = 0;
		}
		const { pt, px, canvasNode } = this;
		if (!canvasNode) {
			throw new Error("call init first");
		}
		this.app = ChainListComponent.PIXIAppbuilder({
			view: canvasNode,
			width: pt(canvasNode.clientWidth),
			height: pt(canvasNode.clientHeight),
			transparent: false,
			antialias: true,
			autoStart: true,
			backgroundColor: 0xffffff
		});
		this.app.stage.addChild(this.list_view);
		this._draw_init();
	}
	private _max_chain_height = 0;
	max_view_height = this.renderer_height;
	get max_chain_height() { return this._max_chain_height; }
	set max_chain_height(h) {
		if (Number.isInteger(h)) {
			this._max_chain_height = h;
			this.max_view_height = Math.max(this.renderer_height, h * this.item_height + this.list_padding_top);
			this._calcInViewBlockItems();
			this._init_scroll();
		}
	}
	list: BlockItem[] = [];
	list_cache: { [chain_height: string]: BlockItem } = {};

	private _draw_init() {
		// 初始化滚动事件的绑定
		this._init_scroll();
		// // 绘制一帧
		// this.setListViewPosY(0);
	}
	// 以下两个参数是用来在max_chain_height变动后，尽可能保持当前的视觉中的元素位置不发生改变
	private _pre_list_view_y = 0;
	private _pre_max_view_height = 0;
	private _scroll_events_cg = () => { };
	private _init_scroll() {
		this._scroll_events_cg();

		const { list_view, item_height, max_view_height, renderer_height } = this;
		if (max_view_height === 0) {
			return;
		}
		const render_h = this.app!.renderer.height;
		const item_n = render_h / item_height;
		list_view.interactive = true;
		if (this._pre_max_view_height === 0) {
			this._pre_max_view_height = max_view_height;
		}
		let list_view_y = this._pre_list_view_y + (this._pre_max_view_height - max_view_height);
		const max_view_y = max_view_height - renderer_height;

		let touch_start_point: PIXI.Point | undefined;
		let per_point: PIXI.Point;
		let list_start_y: number;
		let speed: number;

		let velocity = 0;
		let amplitude = 0;
		let timestamp = 0;
		let target = 0;
		const timeConstant = 325;

		let elasticity = 0;

		const track = (delta: number) => {
			const now = Date.now();
			const elapsed = now - timestamp;
			timestamp = now;

			const v = (Math.abs(delta * 10) * delta) / (1 + elapsed);
			velocity = 0.8 * v + 0.2 * velocity;
		};
		// 更新视图并且检测是否未到达边缘
		const updateAndCheckEdge = () => {
			// 未到达边缘
			var res = true;
			if (list_view_y > 0) {
				list_view_y = 0;
				res = false;
			} else if (-list_view_y > max_view_y) {
				list_view_y = -max_view_y;
				res = false;
			}
			// 更新视野中的元素
			this.setListViewPosY(list_view_y);
			return res;
		};

		let raf_id;
		const autoScroll = () => {
			var elapsed, delta;

			if (amplitude) {
				elapsed = performance.now() - timestamp;
				delta = -amplitude * Math.exp(-elapsed / timeConstant);
				if (delta > 0.5 || delta < -0.5) {
					list_view_y = target + delta;

					raf_id = requestAnimationFrame(autoScroll);
				} else {
					list_view_y = target;
				}
				// 是否
				if (!updateAndCheckEdge()) {
					cancelAnimationFrame(raf_id);
				}
			}
		};
		const pointerdown_handler = (e: PIXI.interaction.InteractionEvent) => {
			touch_start_point = per_point = e.data.global.clone();
			list_start_y = list_view_y;

			velocity = amplitude = 0;
			timestamp = performance.now();
		}
		const pointermove_handler = (e: PIXI.interaction.InteractionEvent) => {
			if (touch_start_point) {
				const cur_point = e.data.global.clone();
				speed = list_view_y =
					cur_point.y - touch_start_point.y + list_start_y;

				// 实时计算动量、速度等等
				track(cur_point.y - per_point.y);

				// 是否
				updateAndCheckEdge();
				per_point = cur_point;
			}
		}
		const pointerup_handler = (e: PIXI.interaction.InteractionEvent) => {
			touch_start_point = undefined;
			const cur_point = e.data.global.clone();
			// console.log("velocity", velocity);
			if (velocity > 10 || velocity < -10) {
				amplitude = 0.8 * velocity;
				target = list_view_y + amplitude;
				timestamp = performance.now();
				requestAnimationFrame(autoScroll);
			}
		}
		list_view.on("pointerdown", pointerdown_handler);
		list_view.on("pointermove", pointermove_handler);
		list_view.on("pointerup", pointerup_handler);
		// 初始化绘制
		updateAndCheckEdge();
		this._scroll_events_cg = () => {
			list_view.removeListener("pointerdown", pointerdown_handler);
			list_view.removeListener("pointermove", pointermove_handler);
			list_view.removeListener("pointerup", pointerup_handler);
			// 将闭包变量复制给缓存
			this._pre_list_view_y = list_view_y
			this._pre_max_view_height = max_view_height
		}
	}
	// 一些基本的样式
	// 列表第一个元素的前置留白
	list_padding_top = this.pt(300);
	get renderer_width() { return this.app ? this.app.renderer.width : 0; }
	get renderer_height() { return this.app ? this.app.renderer.height : 0; }
	// 元素宽度
	get item_width() { return this.renderer_width; }
	// 元素高度
	get item_height() { return this.renderer_width * 0.7; }
	// 元素内部显示的宽度与高度
	get item_content_width() { return this.item_width * 0.92; }
	get item_content_height() { return this.item_height * 0.9; }
	list_view = new PIXI.Container();
	private _list_view_y = 0;
	setListViewPosY(y: number) {
		this._list_view_y = y;
		this._calcInViewBlockItems(y);
	}
	private _pre_render_info = ""
	/*计算出目前在视野中的blockModel以及对应的坐标*/
	private _calcInViewBlockItems(y = this._list_view_y) {
		const { item_height,
			renderer_height,
			list_padding_top,
			max_chain_height,
			list,
			list_cache,
			_pre_render_info
		} = this;

		const abs_y = -y;
		/// 需要跳过的blocks
		const skip_chain_num = Math.floor(Math.max((abs_y - list_padding_top), 0) / item_height);
		const skip_y = list_padding_top + skip_chain_num * item_height;
		const view_end_y = abs_y + renderer_height;
		const diff_y = view_end_y - skip_y;
		const from_y = y + skip_y;
		/// 计算需要显示在屏幕中的元素
		const from_chain_height = max_chain_height - skip_chain_num;

		const cur_render_info = from_chain_height + "," + from_y.toFixed(1) + "," + diff_y.toFixed(1);
		// console.log(cur_render_info, _pre_render_info)
		if (cur_render_info === _pre_render_info) {
			// console.log("tiaozhen")
			return;
		}
		this._pre_render_info = cur_render_info;
		// console.log('abs_y', abs_y | 0, 'skip_y', skip_y | 0, 'skip_chain_num', skip_chain_num,
		// 	'from_y', from_y | 0, 'view_end_y', view_end_y | 0);

		/// 生成新的list以及它对应的缓存
		const new_list: typeof list = [];
		const new_list_cache: typeof list_cache = {};
		for (var i = 0, acc_y = 0; acc_y <= diff_y; i += 1) {
			const chain_height = from_chain_height - i;
			let cache_data = list_cache[chain_height];
			if (!cache_data) {
				// TODO: 应根据滚动速度，来决定是否要执行getBlockByHeight
				cache_data = {
					block: this.blockService.getBlockByHeight(chain_height),
					chain_height,
					loading: true,
					y: 0,
					cardView: this._getUseableBlockCard(chain_height),
				}
			} else {
				// 重用了原本的对象，将之旧缓存中移除
				delete list_cache[chain_height];
			}
			new_list[new_list.length] = cache_data;
			new_list_cache[cache_data.chain_height] = cache_data;
			cache_data.y = from_y + acc_y;
			acc_y += item_height;
			if (chain_height === 1) {
				break;
			}
		}
		/// 将剩余的放入内存重用区
		for (var chain_height in list_cache) {
			// console.log("add to cg cache", chain_height);
			this._addUserableBlockCard(chain_height, list_cache[chain_height].cardView);
		}

		this.list = new_list;
		this.list_cache = new_list_cache;
		this._drawBlockItems(new_list);
	}
	/*绘制_calcInViewBlockItems返回的结果*/
	private _drawBlockItems(list = this.list) {
		const { list_view } = this;
		for (var i = 0, b; b = list[i]; i += 1) {
			if (b.cardView.parent !== list_view) {
				list_view.addChild(b.cardView);
			}
			b.cardView.updateBlockModel(b.chain_height, b.block);
			b.cardView.y = b.y;
		}
	}
	private _useable_blockcard_cache: { [chain_height: string]: BlockCard } = {};
	private _getUseableBlockCard(height: number) {
		const { _useable_blockcard_cache } = this;
		const cache = _useable_blockcard_cache[height];
		if (cache) {
			delete _useable_blockcard_cache[height];
			return cache;
		}
		for (var k in _useable_blockcard_cache) {
			const cache = _useable_blockcard_cache[k];
			delete _useable_blockcard_cache[k];
			return cache;
		}
		return new BlockCard(this.item_width, this.item_height, height)
	}
	private _addUserableBlockCard(height: string, bc: BlockCard) {
		bc.parent.removeChild(bc);
		this._useable_blockcard_cache[height] = bc;
	}
}

class BlockCard extends PIXI.Graphics {
	chain_height!: number
	block?: BlockModel | Promise<BlockModel>
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
		const { height_text, shadown } = this;

		// init shadown
		{
			shadown.beginFill(0x3399ff, 1);
			const s_w = this.width * 0.92;
			const s_h = this.height * 0.9;
			const s_l = (this.width - s_w) / 2;
			const s_t = (this.height - s_h) / 2;
			shadown.drawRoundedRect(s_l, s_t, s_w, s_h, s_l);
			shadown.endFill();
			// const glow_filter = new PIXI.filters.GlowFilter();
			const shadow_filter = new PIXI.filters.DropShadowFilter();
			shadow_filter.alpha = 0.3;
			shadow_filter.blur = W * 0.005 * 2;
			shadow_filter.rotation = 90;
			shadow_filter.quality = 5;
			shadow_filter.distance = W * 0.01;
			// shadow_filter.shadowOnly = true;
			shadow_filter.color = 0x0;
			this.filters = [shadow_filter];
			this.addChild(shadown);
		}

		// init height text
		{
			height_text.x = this.width / 2 - height_text.width / 2;
			height_text.y = this.height / 2 - height_text.height / 2;
			this.addChild(height_text);
		}
		// 尝试绘制
		this.updateBlockModel(chain_height, block);
	}
	shadown = new PIXI.Graphics();
	height_text = new PIXI.Text("", {
		fill: 0xffffff,
		fontSize: this.W * 0.1,
	});
	updateBlockModel(height: number, block: BlockModel | Promise<BlockModel> | undefined) {
		if (height !== this.chain_height) {
			this.chain_height = height;
			this.drawHeightText();
		}
		if (this.block !== block) {
			this.block = block;
			if (block instanceof Promise) {
				block.then((bm) => {
					if (this.block === block) {
						this.block = bm;
						this.drawBlockModel(bm);
					}
				});
			} else if (block) {
				this.drawBlockModel(block);
			} else {
				this.undrawBlockModel();
			}
		}
	}
	drawHeightText() {
		this.cacheAsBitmap = false;
		const { block, height_text } = this;
		if (height_text.text) {
			height_text.text = this.chain_height + "";
		}
		this.cacheAsBitmap = true;
	}
	drawBlockModel(block: BlockModel) {
		this.cacheAsBitmap = false;
		// TODO: draw text
		this.cacheAsBitmap = true;
	}
	undrawBlockModel() {
		this.cacheAsBitmap = false;
		// TODO: clear text
		this.cacheAsBitmap = true;
	}
}