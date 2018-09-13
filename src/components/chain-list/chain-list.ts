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
import { afCtrl } from "../../bnqkl-framework/helper";
import * as PIXI from "pixi.js";
import * as PIXI_Filters from "pixi-filters";
import { TranslateService } from "@ngx-translate/core";
import {
  BlockModel,
  BlockServiceProvider,
} from "../../providers/block-service/block-service";
import { BlockCard } from "./block-card";
import { GoldBlockCard } from "./block-card.gold";
import { OverBlockCard } from "./block-card.over";
import { CardChain } from "./card-chain";
import { Slides } from "./trend-graph-slides/slides";
import { TrendSlide } from "./trend-graph-slides/trend.slide";

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
loader.add("block_card_over_bg", "assets/imgs/tab-chain/block-card-over.png");
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

import { commonFontFamily, iconFontFamily } from "./helper";

@Component({
  selector: "chain-list",
  templateUrl: "chain-list.html",
})
export class ChainListComponent extends AniBase {
  @FLP_Tool.FromGlobal translate!: TranslateService;
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
    OverBlockCard.bg_resource = resource.block_card_over_bg.texture;
    CardChain.bg_resource = resource.chain_texture.texture;
    this.emit("app-inited");
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
      this.emit("max_chain_height:changed", h);
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
          this.view_padding_top +
          this.list_padding_bottom
      );
      if (
        this._isInTouch() === false &&
        -this._getListViewY() < this.item_height * 2
      ) {
        // 刷新参数
        this._init_scroll({ no_refresh: true });
        // 使用动画的方式滚动到第一个块
        this.setListViewPosY(0, 500);
        // this.setListViewPosY(0);
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
  /// 一些基本的样式

  private _list_padding_top = this.pt(300);
  /**列表第一个元素的前置留白*/
  get list_padding_top() {
    return this._list_padding_top;
  }
  set list_padding_top(v) {
    if (v !== this._list_padding_top) {
      this._list_padding_top = v;
      this.renderer_started && this._calcInViewBlockItems();
    }
  }
  get view_padding_top() {
    return this.list_padding_top + this.slides.height;
  }
  private _list_padding_bottom = this.pt(100);
  /**最后一个元素的底部留白*/
  get list_padding_bottom() {
    return this._list_padding_bottom;
  }
  set list_padding_bottom(v) {
    if (v !== this._list_padding_bottom) {
      this._list_padding_bottom = v;
      this.renderer_started && this._calcInViewBlockItems();
    }
  }
  /**元素宽度*/
  get item_width() {
    return this.renderer_width;
  }
  /**元素高度*/
  get item_height() {
    return this.renderer_width * 0.55; //0.62;
  }
  /**用于显示区块的列表*/
  list_view = new PIXI.Container();
  /**用于显示链表的列表*/
  chain_view = new PIXI.Container();
  /**特殊的顶部slides对象*/
  slides: Slides = this.on("app-inited", () => {
    const W = this.renderer_width;
    const app = this.app as PIXI.Application;
    const slides = (this.slides = new Slides(W, W * 0.45, W * 0.08, app));
    app.stage.addChild(slides);
    slides.on("refresh-frame", () => {
      this.forceRenderOneFrame();
    });

    let _cahce_height = -1;
    let cache_data: Promise<BlockModel[]> = Promise.resolve([]);
    const get30MinRangeBlockList = (height: number) => {
      if (_cahce_height !== height) {
        _cahce_height = height;
        const unit_block_time = this.blockService.appSetting.BLOCK_UNIT_TIME;
        const block_num = Math.round((60 * 60 * 1000) / unit_block_time);
        cache_data = this.blockService.getBlocksByRange(
          Math.max(height - block_num, 1),
          height,
          1 //从小到大
        );
      }
      return cache_data;
    };

    const slide_args_list = [
      {
        // 交易数量
        title: "THE_NUMBER_OF_TRANSACTIONS_TREND",
        opts: {
          title_icon: "\ue653",
        },
        getData: () => {
          return get30MinRangeBlockList(this.max_chain_height).then(
            block_list =>
              block_list.map(block => [
                block.height,
                block.numberOfTransactions,
              ]) as [number, number][]
          );
        },
      },
      {
        // 交易金额
        title: "AMOUNT_OF_THE_TRANSACTION_TREND",
        opts: {
          title_icon: "\ue643",
          chart_line_style: {
            gradient: [[0, "#f9a561"], [1, "#fccd51"]],
          },
          auxiliary_text_style: {
            fill: 0xf9a561,
          },
        },
        getData: () => {
          return get30MinRangeBlockList(this.max_chain_height).then(
            block_list =>
              block_list.map(block => [
                block.height,
                parseFloat(block.totalAmount) / 1e8,
              ]) as [number, number][]
          );
        },
      },
    ];

    //ifm-zhanghujine
    for (var i = 0; i < slide_args_list.length; i += 1) {
      const slide_args = slide_args_list[i];
      const tr = new TrendSlide(W * 0.92, W * 0.45, ``, app, slide_args.opts);
      this.translate.stream([slide_args.title]).subscribe(values => {
        tr.title_content = values[slide_args.title];
      });
      tr.data = [[0, 0], [1, 1]];
      slides.addSlide(tr);

      tr.on("refresh-frame", () => {
        this.forceRenderOneFrame();
      });

      const setTrData = () => {
        slide_args.getData().then(data => {
          // console.log(slide_args.title, data);
          tr.data = data;
        });
      };
      setTrData();
      this.on("max_chain_height:changed", setTrData);
    }
  }) as any;

  setListViewPosY(y: number, ani_ms?: number) {
    if (this._setListViewY(y, ani_ms)) {
      this._calcInViewBlockItems(y);
    }
  }
  private _pre_render_info = "";
  /**计算出目前在视野中的blockModel以及对应的坐标*/
  private _calcInViewBlockItems(
    y = this._getListViewY(),
    force_render?: boolean
  ) {
    const {
      item_height,
      renderer_height,
      view_padding_top,
      max_chain_height,
      list,
      list_cache,
      _pre_render_info,
    } = this;

    const abs_y = -y;
    /// 需要跳过的blocks
    const skip_chain_num = Math.floor(
      Math.max(abs_y - view_padding_top, 0) / item_height
    );
    const skip_y = view_padding_top + skip_chain_num * item_height;
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

    if (skip_chain_num === 0) {
      /// 如果是在区块链顶端，则显示slides
      this.slides.visible = true;
      this.slides.y = from_y - this.slides.height;
    } else {
      this.slides.visible = false;
    }

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
        list_cache[chain_height].cardView
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
  private _useable_over_blockcard?: OverBlockCard;
  private _getUseableBlockCard(height: number) {
    // 1. 金色区块
    if (height % 57 === 0) {
      let { _useable_over_blockcard } = this;
      if (!_useable_over_blockcard) {
        _useable_over_blockcard = new OverBlockCard(
          this.item_width,
          this.item_height,
          height
        );
        this._init_block_card_bind(_useable_over_blockcard);
        this._useable_over_blockcard = _useable_over_blockcard;
      }
      return _useable_over_blockcard;
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
    if (bc === this._useable_over_blockcard) {
      return;
    }
    this._useable_blockcard_cache[height] = bc;
  }
}
