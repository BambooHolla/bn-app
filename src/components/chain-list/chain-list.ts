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
  EventEmitter,
} from "@angular/core";
import { AniBase, ifmicon_font_ready } from "../AniBase";
import { PromiseOut } from "../../bnqkl-framework/PromiseExtends";
import { FLP_Tool } from "../../bnqkl-framework/FLP_Tool";
import * as PIXI from "pixi.js";
import * as PIXI_Filters from "pixi-filters";
import { TranslateService } from "@ngx-translate/core";
import {
  BlockModel,
  BlockServiceProvider,
} from "../../providers/block-service/block-service";
Object.assign(PIXI.filters, PIXI_Filters);

type BlockItem = {
  block?: BlockModel | Promise<BlockModel>;
  chain_height: number;
  y: number;
  cardView: BlockCard;
};

export const loader = new PIXI.loaders.Loader();
export const _load_resource_promiseout = new PromiseOut<
  PIXI.loaders.ResourceDictionary
>();
export const FRAMES_NUM = 60;
export const frames_list: PIXI.Texture[] = [];
loader.add("block_card_blue_bg", "assets/imgs/tab-chain/block-card-blue.png");
loader.add("block_card_gold_bg", "assets/imgs/tab-chain/block-card-gold.png");
loader.add("chain_texture", "assets/imgs/tab-chain/chain-texture.png");

loader.onError.add(err => {
  _load_resource_promiseout.reject(err);
});
loader.load((loader, resources) => {
  ifmicon_font_ready
    .catch(err => console.error("ifmicon font check error!", err))
    .then(() => {
      _load_resource_promiseout.resolve(resources);
    });
});

const commonFontFamily = [
  "-apple-system",
  "Helvetica Neue",
  "Roboto",
  "sans-serif",
];

@Component({
  selector: "chain-list",
  templateUrl: "chain-list.html",
})
export class ChainListComponent extends AniBase {
  @ViewChild("canvas") canvasRef!: ElementRef;
  // devicePixelRatio = Math.ceil(Math.sqrt(window.devicePixelRatio));

  constructor(public blockService: BlockServiceProvider) {
    super();
    this.on("init-start", this.initPixiApp.bind(this));
  }

  _init() {
    const canvasNode: HTMLCanvasElement =
      this.canvasNode || (this.canvasNode = this.canvasRef.nativeElement);
    // this.ctx = this.canvasNode.getContext("2d");
    return super._init();
  }
  startAnimation() {
    this.is_started = true;
  }
  stopAnimation() {
    this.is_started = false;
  }

  _renderer_width = 0;
  get renderer_width() {
    return this._renderer_width;
  }
  set renderer_width(v) {
    this._renderer_width = v;
  }
  private _renderer_height = 0;
  get renderer_height() {
    return this._renderer_height;
  }
  set renderer_height(v) {
    if (v !== this._renderer_height) {
      this._renderer_height = v;
      this._calcMaxViewHeight();
    }
  }
  async initPixiApp() {
    if (this.app) {
      this.app.stage.children.slice().forEach(child => {
        return child.destroy();
      });
      this._loop_runs.length = 0;
    } else {
      const { pt, px, canvasNode } = this;
      if (!canvasNode) {
        throw new Error("call init first");
      }
      this.app = ChainListComponent.PIXIAppbuilder({
        view: canvasNode,
        width: (this.renderer_width = this.pt(document.body.clientWidth)),
        height: (this.renderer_height = this.pt(document.body.clientHeight)),
        transparent: true,
        antialias: true,
        autoStart: true,
        // backgroundColor: 0xffffff,
      });
    }
    this.app.stage.addChild(this.list_view);
    this.app.stage.addChild(this.chain_view);
    const resource: PIXI.loaders.ResourceDictionary = await _load_resource_promiseout.promise;
    BlockCard.bg_resource = resource.block_card_blue_bg.texture;
    GoldBlockCard.bg_resource = resource.block_card_gold_bg.texture;
    CardChain.bg_resource = resource.chain_texture.texture;
    this._draw_init();
  }

  private _max_chain_height = 0;
  max_view_height = 0;
  @Input("max-chain-height")
  get max_chain_height() {
    return this._max_chain_height;
  }
  set max_chain_height(h) {
    if (Number.isInteger(h) && h > 0 && this._max_chain_height !== h) {
      this._max_chain_height = h;
      this._calcMaxViewHeight();
    }
  }
  private _calcMaxViewHeight() {
    if (
      this.renderer_height &&
      this.max_chain_height &&
      this.renderer_started
    ) {
      this.max_view_height = Math.max(
        this.renderer_height,
        this.max_chain_height * this.item_height +
          this.list_padding_top +
          this.list_padding_bottom,
      );
      if (
        this._isInTouch() === false &&
        -this._getListViewY() < this.item_height * 2
      ) {
        // 刷新参数
        this._init_scroll({ no_refresh: true });
        // 使用动画的方式滚动到第一个块
        this.setListViewPosY(0, 500);
      } else {
        // 直接刷新
        this._init_scroll();
      }
    }
  }
  list: BlockItem[] = [];
  list_cache: { [chain_height: string]: BlockItem } = {};

  private _draw_init() {
    // 初始化滚动事件的绑定
    this._init_scroll();
  }
  // // 以下两个参数是用来在max_chain_height变动后，尽可能保持当前的视觉中的元素位置不发生改变
  // private _pre_list_view_y = 0;
  // private _pre_max_view_height = 0;
  private _scroll_config_host_reload = (no_refresh?: boolean) => {};
  private _get_velocity = () => 0;
  private _inited_scroll = false;
  private _init_scroll(opts: { no_refresh?: boolean } = {}) {
    if (!this.app) {
      return;
    }
    let max_view_height = this.max_view_height || this.renderer_height;
    if (max_view_height === 0) {
      return;
    }
    if (this._inited_scroll) {
      this._scroll_config_host_reload(opts.no_refresh);
      return;
    }
    this._inited_scroll = true;
    const { list_view, item_height, renderer_height, pt } = this;
    const render_h = this.app.renderer.height;
    const item_n = render_h / item_height;
    list_view.interactive = true;

    let list_view_y = 0;
    let max_view_y = max_view_height - renderer_height;

    let touch_start_point: PIXI.Point | undefined;
    let per_point: PIXI.Point;
    let list_start_y: number;
    let acc_move_y: number; // 累计的滑动距离。 到一定程度的时候，就要禁止滚动了

    let velocity = 0;
    let amplitude = 0;
    let timestamp = 0;
    let start_timestamp = 0;
    let target = 0;
    const timeConstant = 325;

    let elasticity = 0;

    const track = (delta: number) => {
      const now = performance.now();
      const elapsed = now - timestamp;
      timestamp = now;

      const v = (Math.abs(delta * 10) * delta) / (1 + elapsed);
      velocity = 0.8 * v + 0.2 * velocity;

      // track
      if (acc_move_y > 20 || now - start_timestamp > 500 || v > 500) {
        // 进入滚动状态，或者进入长按状态，或者快速地短距离地在滚动时，禁用点击
        this.setBlockCardListTap(false);
      } else {
        // 过了阈值就不需要再累加了
        acc_move_y += Math.abs(delta);
        this.setBlockCardListTap(true);
      }
    };
    // 更新视图并且检测是否未到达边缘
    const updateAndCheckEdge = (force_render?: boolean) => {
      // 未到达边缘
      var res = true;
      if (list_view_y > 0) {
        list_view_y = 0;
        res = false;
        delta = 0; // 速度归0
      } else if (-list_view_y > max_view_y) {
        list_view_y = -max_view_y;
        res = false;
        delta = 0; // 速度归0
      }
      // 更新视野中的元素
      this._calcInViewBlockItems(list_view_y, force_render);
      return res;
    };

    const raf = time_const => {
      if (raf_id) {
        caf();
      }
      raf_id = this.raf(() => {
        raf_id = undefined;
        autoScroll(time_const);
      });
    };
    const caf = () => {
      if (raf_id) {
        this.caf(raf_id);
        raf_id = undefined;
      }
    };

    let raf_id;
    let delta;
    const allow_tap_range = pt(15);
    const autoScroll = (time_const: number) => {
      if (amplitude) {
        const elapsed = performance.now() - timestamp;
        delta = -amplitude * Math.exp(-elapsed / time_const);
        if (delta > 0.5 || delta < -0.5) {
          list_view_y = target + delta;

          raf(time_const);
        } else {
          list_view_y = target;
        }
        if (delta > allow_tap_range || delta < -allow_tap_range) {
          this.setBlockCardListTap(false);
        } else {
          this.setBlockCardListTap(true);
        }
        // 是否
        if (!updateAndCheckEdge()) {
          caf();
        }
      }
    };
    list_view.on("pointerdown", (e: PIXI.interaction.InteractionEvent) => {
      touch_start_point = per_point = e.data.global.clone();
      list_start_y = list_view_y;
      acc_move_y = 0;

      velocity = amplitude = 0;
      start_timestamp = timestamp = performance.now();

      delta = 0; // 清空速度值
      updateAndCheckEdge(true); // 强制渲染一下
    });
    list_view.on("pointermove", (e: PIXI.interaction.InteractionEvent) => {
      if (touch_start_point) {
        const cur_point = e.data.global.clone();
        list_view_y = cur_point.y - touch_start_point.y + list_start_y;
        delta = 0;

        // 实时计算动量、速度等等
        track(cur_point.y - per_point.y);

        // 是否
        updateAndCheckEdge();
        per_point = cur_point;
      }
    });
    list_view.on("pointerup", (e: PIXI.interaction.InteractionEvent) => {
      touch_start_point = undefined;
      const cur_point = e.data.global.clone();
      // console.log("velocity", velocity);
      if (velocity > 10 || velocity < -10) {
        amplitude = 0.8 * velocity;
        target = list_view_y + amplitude;
        timestamp = performance.now();
        raf(timeConstant);
      } /*if (performance.now() - start_timestamp < 500)*/ else {
        // 没有滚动的情况下，可以直接重置为可点击
        // 快速的点击并起来，能重新使得元素可点击
        delta = 0; // 清空速度值
        this.setBlockCardListTap(true);
        // updateAndCheckEdge(true);// 强制渲染一下
      }
    });
    // 默认可以点击子元素
    this.setBlockCardListTap(true);
    this._scroll_config_host_reload = (no_refresh?: boolean) => {
      // 准备更新闭包变量
      const pre_max_view_height = max_view_height;
      // 更新变量
      max_view_height = this.max_view_height;
      const diff_max_view_height = pre_max_view_height - max_view_height;
      if (diff_max_view_height !== 0) {
        list_view_y += diff_max_view_height;
        list_start_y += diff_max_view_height;
        target += diff_max_view_height;

        max_view_y = max_view_height - renderer_height;
        if (!no_refresh) {
          updateAndCheckEdge();
        }
      }
    };
    this._setListViewY = (new_list_view_y, ani_ms?: number) => {
      if (new_list_view_y === list_view_y) {
        return false;
      }
      if (typeof ani_ms === "number") {
        target = new_list_view_y;
        timestamp = performance.now();
        amplitude = new_list_view_y - list_view_y;
        raf(ani_ms / Math.log(Math.abs(amplitude) * 2));
        // 使用动画滚动，理论上当前这一帧的list_view_y没有发生改变，所以返回false
        return false;
      }
      const diff = list_view_y - new_list_view_y;
      list_view_y -= diff;
      list_start_y -= diff;
      target -= diff;
      return true;
    };
    this._getListViewY = () => list_view_y;
    this._get_velocity = () => delta;
    this._isInTouch = () => !!touch_start_point;

    this.renderer_started = true;
    // 初始化绘制
    this._calcMaxViewHeight();
    this.emit("renderer-started");
  }
  private _block_card_list_can_tap;
  setBlockCardListTap(can_tap: boolean) {
    if (this._block_card_list_can_tap === can_tap) {
      return;
    }
    this._block_card_list_can_tap = can_tap;
    for (var i = 0, bi: BlockItem; (bi = this.list[i]); i += 1) {
      bi.cardView.setTapAble(can_tap);
    }
    this.forceRenderOneFrame();
  }
  renderer_started = false;
  private _setListViewY(v: number, ms?: number) {
    return false;
  }
  private _getListViewY() {
    return 0;
  }
  private _isInTouch() {
    return false;
  }
  // 一些基本的样式
  // 列表第一个元素的前置留白
  private _list_padding_top = this.pt(300);
  get list_padding_top() {
    return this._list_padding_top;
  }
  set list_padding_top(v) {
    if (v !== this._list_padding_top) {
      this._list_padding_top = v;
      this.renderer_started && this._calcInViewBlockItems();
    }
  }
  // 最后一个元素的底部留白
  private _list_padding_bottom = this.pt(100);
  get list_padding_bottom() {
    return this._list_padding_bottom;
  }
  set list_padding_bottom(v) {
    if (v !== this._list_padding_bottom) {
      this._list_padding_bottom = v;
      this.renderer_started && this._calcInViewBlockItems();
    }
  }
  // 元素宽度
  get item_width() {
    return this.renderer_width;
  }
  // 元素高度
  get item_height() {
    return this.renderer_width * 0.55; //0.62;
  }

  list_view = new PIXI.Container();
  chain_view = new PIXI.Container();
  setListViewPosY(y: number, ani_ms?: number) {
    if (this._setListViewY(y, ani_ms)) {
      this._calcInViewBlockItems(y);
    }
  }
  private _pre_render_info = "";
  /*计算出目前在视野中的blockModel以及对应的坐标*/
  private _calcInViewBlockItems(
    y = this._getListViewY(),
    force_render?: boolean,
  ) {
    const {
      item_height,
      renderer_height,
      list_padding_top,
      max_chain_height,
      list,
      list_cache,
      _pre_render_info,
    } = this;

    const abs_y = -y;
    /// 需要跳过的blocks
    const skip_chain_num = Math.floor(
      Math.max(abs_y - list_padding_top, 0) / item_height,
    );
    const skip_y = list_padding_top + skip_chain_num * item_height;
    const view_end_y = abs_y + renderer_height;
    const diff_y = view_end_y - skip_y;
    const from_y = y + skip_y;
    /// 计算需要显示在屏幕中的元素
    const from_chain_height = max_chain_height - skip_chain_num;

    const cur_render_info =
      from_chain_height + "," + abs_y.toFixed(1) + "," + renderer_height;
    // console.log(cur_render_info, _pre_render_info)
    if (cur_render_info === _pre_render_info && !force_render) {
      // console.log("tiaozhen")
      return;
    }
    this._pre_render_info = cur_render_info;
    // console.log('abs_y', abs_y | 0, 'skip_y', skip_y | 0, 'skip_chain_num', skip_chain_num,
    //   'from_y', from_y | 0, 'view_end_y', view_end_y | 0);

    /// 生成新的list以及它对应的缓存
    const new_list: typeof list = [];
    const new_list_cache: typeof list_cache = {};
    const v = this._get_velocity();
    for (var i = 0, acc_y = 0; acc_y <= diff_y; i += 1) {
      const chain_height = from_chain_height - i;
      let cache_data = list_cache[chain_height];
      if (!cache_data) {
        cache_data = {
          block: undefined, // dataService.getBlockByHeight(chain_height),
          chain_height,
          y: 0,
          cardView: this._getUseableBlockCard(chain_height),
        };
      } else {
        // 重用了原本的对象，将之旧缓存中移除
        delete list_cache[chain_height];
      }
      // 应根据滚动速度，来决定是否要执行getBlockByHeight
      if (v <= 500 && !cache_data.block) {
        cache_data.block = this.blockService.getBlockByHeight(chain_height);
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
      this._addUserableBlockCard(
        chain_height,
        list_cache[chain_height].cardView,
      );
    }

    this.list = new_list;
    this.list_cache = new_list_cache;
    this._drawBlockItems(new_list);
  }
  /*绘制_calcInViewBlockItems返回的结果*/
  private _drawBlockItems(list = this.list) {
    const { list_view, chain_view, item_height } = this;
    const cardchain_getter = this._getUsebaleCardChainGenerator(list.length);
    const chain_pos_y = item_height * 0.88;
    for (var i = 0, b; (b = list[i]); i += 1) {
      if (b.cardView.parent !== list_view) {
        list_view.addChild(b.cardView);
      }
      b.cardView.updateBlockModel(b.chain_height, b.block);
      b.cardView.y = b.y;

      if (b.chain_height > 1) {
        const cardchain = cardchain_getter.next().value;
        cardchain.visible = true;
        cardchain.y = b.y + chain_pos_y;
      }
    }
    // 把其余的铰链都隐藏了
    var res_cardchain = cardchain_getter.next();
    while (!res_cardchain.done) {
      res_cardchain.value.visible = false;
      res_cardchain = cardchain_getter.next();
    }
    this.forceRenderOneFrame();
  }
  private _useable_blockcard_cache: {
    [chain_height: string]: BlockCard;
  } = {};
  private _useable_gold_blockcard?: GoldBlockCard;
  private _getUseableBlockCard(height: number) {
    // 1. 金色区块
    if (height % 57 === 0) {
      let { _useable_gold_blockcard } = this;
      if (!_useable_gold_blockcard) {
        _useable_gold_blockcard = new GoldBlockCard(
          this.item_width,
          this.item_height,
          height,
        );
        this._init_block_card_bind(_useable_gold_blockcard);
        this._useable_gold_blockcard = _useable_gold_blockcard;
      }
      return _useable_gold_blockcard;
    }
    const { _useable_blockcard_cache } = this;
    const cache = _useable_blockcard_cache[height];
    // 2. 等高区块
    if (cache) {
      delete _useable_blockcard_cache[height];
      return cache;
    }
    // 3. 不等高区块
    for (var k in _useable_blockcard_cache) {
      const cache = _useable_blockcard_cache[k];
      delete _useable_blockcard_cache[k];
      return cache;
    }
    // 新区块
    const block_card = new BlockCard(this.item_width, this.item_height, height);
    this._init_block_card_bind(block_card);
    return block_card;
  }
  private _init_block_card_bind(bc: BlockCard) {
    bc.on("click-footer", (height, block) => {
      const v = this._get_velocity();
      if (v < 100) {
        this.clickItemFooter.emit({ height, block });
      }
    });
    bc.on("refresh-frame-in-async", () => {
      this.forceRenderOneFrame();
    });
    return bc;
  }
  @Output("click-item-footer")
  clickItemFooter = new EventEmitter<{
    height: number;
    block: typeof BlockCard.prototype.block;
  }>();
  private _useable_cardchain_cache: CardChain[] = [];
  private *_getUsebaleCardChainGenerator(num) {
    const {
      _useable_cardchain_cache,
      chain_view,
      item_width,
      item_height,
    } = this;
    const len = Math.max(num, _useable_cardchain_cache.length);
    for (var i = 0; i < num; i += 1) {
      var cardchain = _useable_cardchain_cache[i];
      if (!cardchain) {
        cardchain = new CardChain(item_width, item_height);
        chain_view.addChild(cardchain);
        _useable_cardchain_cache[i] = cardchain;
      }
      yield cardchain;
    }
  }
  private _addUserableBlockCard(height: string, bc: BlockCard) {
    bc.parent.removeChild(bc);
    if (bc === this._useable_gold_blockcard) {
      return;
    }
    this._useable_blockcard_cache[height] = bc;
  }
}

const _label_width_cache = new Map<string, number>();
/*缓存一些固定文本的宽度，避免重复计算*/
function getLabelWidth(pixi_text: PIXI.Text) {
  const { text } = pixi_text;
  var width = _label_width_cache.get(text);
  if (typeof width !== "number") {
    width = pixi_text.width;
    _label_width_cache.set(text, width);
  }
  return width;
}
class BlockCard extends PIXI.Graphics {
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
    block?: BlockModel | Promise<BlockModel>,
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
      // // 可能被取消
      // if (this._show_footer_container_mask === false) {
      //   return;
      // }
      this.toggleFooterContainerMask(false);
      this.emit("refresh-frame-in-async");
    });
    this.on("pointertap", () => {
      this.emit("click-footer", this.chain_height, this.block);
    });
    this.footer_container.addChild(this.footer_container_mask);
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
    // const res_aplha = is_show ? 1 : 0;
    // if (this.footer_container_mask.alpha !== res_aplha) {
    //   // this.footer_container.cacheAsBitmap = false;
    //   this.footer_container_mask.alpha = res_aplha;
    //   // this.footer_container.cacheAsBitmap = true;
    // }

    if (is_show) {
      if (!this.filters || this.filters.length !== 1) {
        this.filters = [this.shadow_filter];
      }
    } else {
      this.filters = null;
    }
    // const shadow_filter_alpha = is_show ? 0.4 : 0.2;
    // if (this.shadow_filter.alpha !== shadow_filter_alpha) {
    //   this.filters = [];

    //   const old_cacheAsBitmap = this.shadown.cacheAsBitmap;
    //   if (old_cacheAsBitmap) {
    //     this.shadown.cacheAsBitmap = false;
    //     this.shadow_filter.alpha = shadow_filter_alpha;
    //     this.shadown.cacheAsBitmap = true;
    //   } else {
    //     this.shadow_filter.alpha = shadow_filter_alpha;
    //   }
    // }
  }
  shadown = new PIXI.Graphics();

  get style_header_content() {
    const { W } = this;
    return {
      fill: 0x7b7b7b,
      fontSize: W * 0.075,
      fontFamily: commonFontFamily,
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
      fontFamily: ["ifmicon", ...commonFontFamily],
      padding: W * 0.04,
    };
  }
  get style_detail_label() {
    const { W } = this;
    return {
      fill: 0x7b7b7b,
      fontSize: W * 0.038,
      fontFamily: ["ifmicon", ...commonFontFamily],
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
      fontFamily: ["ifmicon", ...commonFontFamily],
      padding: W * 0.038,
    };
  }
  get style_footer_label_icon() {
    const { W } = this;
    return {
      fill: 0xffffff,
      fontSize: W * 0.1,
      fontFamily: ["ifmicon", ...commonFontFamily],
      padding: W * 0.05,
    };
  }
  /*模拟 text-align: center*/
  private _textAlignCenter(text: PIXI.Text, vw: number, left_or_right: 1 | -1) {
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
  footer_container_mask = new PIXI.Graphics();
  view_block_detail_label = new PIXI.Text("", this.style_footer_label);
  view_block_detail_label_icon = new PIXI.Text(
    "",
    this.style_footer_label_icon,
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
      footer_container_mask,
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
      footer_container_mask.beginFill(0xffffff, 0.15);
      footer_container_mask.drawRoundedRect(0, 0, w, h, h * 0.1);
      footer_container_mask.endFill();
      // 查看区块
      view_block_detail_label.text = label_config.view_block_detail;
      view_block_detail_label.y = (h - W * 0.038) / 2;
      view_block_detail_label.x =
        w * 0.48 - getLabelWidth(view_block_detail_label) / 2;
      // ->
      view_block_detail_label_icon.text = label_config.view_block_detail_icon;
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
    block: BlockModel | Promise<BlockModel> | undefined,
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
    height_content.y = H * 0.18;
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
      tran_num_content.y = H * 0.18;
      this._textAlignCenter(tran_num_content, 0.16, -1);
    }
    {
      total_amount_content.text = AniBase.amountToString(block.totalAmount);
      total_amount_content.x = right_base_line - total_amount_content.width;
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
    if (v === true) {
      if (this._cache_as_bitmap_ti) {
        return;
      } else {
        this._cache_as_bitmap_ti = FLP_Tool.raf(() => {
          this._cache_as_bitmap_ti = undefined;
          this.cacheAsBitmap = true;
        });
      }
    } else {
      if (this._cache_as_bitmap_ti) {
        FLP_Tool.caf(this._cache_as_bitmap_ti);
        this._cache_as_bitmap_ti = undefined;
      }
      this.cacheAsBitmap = false;
    }
  }
}

class GoldBlockCard extends BlockCard {
  get style_header_label() {
    const { W } = this;
    return {
      fill: [0xf9a760, 0xfbc554],
      fontSize: W * 0.04,
      fontFamily: ["ifmicon", ...commonFontFamily],
      padding: W * 0.04,
    };
  }
}

class CardChain extends PIXI.Container {
  static bg_resource: PIXI.Texture;
  get bg_resource() {
    return (this.constructor as typeof BlockCard).bg_resource;
  }
  constructor(public W: number, public H: number) {
    super();
    this.drawChain();
    this.addChild(this.left_chain);
    this.addChild(this.right_chain);
    this.cacheAsBitmap = true;
  }
  left_chain = new PIXI.Graphics();
  right_chain = new PIXI.Graphics();
  drawChain() {
    const { left_chain, right_chain, W } = this;
    this._drawChainItem(left_chain);
    this._drawChainItem(right_chain);

    left_chain.x = W * 0.1;
    right_chain.x = W - left_chain.x - right_chain.width;
    this.right_chain = right_chain;
  }
  private _drawChainItem(parent: PIXI.Container) {
    const { W, H } = this;
    const unit_w = W * 0.1;
    const unit_h = H;
    // 直接使用贴图
    const s = new PIXI.Sprite(this.bg_resource);
    parent.addChild(s);
    s.height = H * 0.25;
    s.scale.x = s.scale.y;
    parent.addChild(s);
  }
}
