import { Component, ElementRef, ViewChild } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
} from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import {
  BlockServiceProvider,
  BlockModel,
  UnconfirmBlockModel,
} from "../../providers/block-service/block-service";
import { Subscription } from "rxjs/Subscription";
import { ChainMeshComponent } from '../../components/chain-mesh/chain-mesh'


// type BlockWithPosModel = BlockModel & {
//   y: number;
// };

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
    public viewCtrl: ViewController,
  ) {
    super(navCtrl, navParams);
    this.auto_header_shadow_when_scroll_down = true;
  }
  unconfirm_block_mesh_thit = 0xa4a2a3;

  block_list: Array<BlockModel> = [];
  block_list_config = {
    loading: false,
    page: 1,
    pageSize: 20,
    has_more: false,
  };

  @ViewChild(ChainMeshComponent) chainMesh!: ChainMeshComponent
  unconfirm_block?: UnconfirmBlockModel;
  @TabChainPage.willEnter
  async loadUnconfirmBlock() {
    this.unconfirm_block = await this.blockService.expectBlockInfo.getPromise();
    this.chainMesh && this.chainMesh.forceRenderOneFrame();
  }

  // @asyncCtrlGenerator.loading(
  //   () => TabChainPage.getTranslate("LOADING_BLOCK_LIST"),
  //   undefined,
  //   {
  //     cssClass: "can-tap",
  //     showBackdrop: false,
  //   },
  // )
  @TabChainPage.willEnter
  @asyncCtrlGenerator.error(() =>
    TabChainPage.getTranslate("LOAD_BLOCK_LIST_ERROR"),
  )
  async loadBlockList(
    opts: {
      force?: boolean;
      increment?: boolean;
      increment_length?: number;
    } = {},
  ) {
    const { block_list_config, block_list } = this;
    const increment = !!opts.increment;
    if (block_list.length && !opts.force && !increment) {
      // 只初始化加载一次列表
      return;
    }
    if (block_list_config.loading) {
      // 规避快速的列表切换
      return;
    }
    block_list_config.loading = true;
    try {
      const size_length = increment
        ? opts.increment_length
        : block_list_config.pageSize;
      if (!size_length) {
        throw new TypeError("the length of get block list is error");
      }
      if (size_length <= 0) {
        throw new RangeError("the length of get block list is outof range");
      }

      const list = this.blockService.blockListHandle(
        await this.blockService.getTopBlocks(false, size_length),
      );
      if (increment) {
        // 增量更新
        this.block_list.unshift(...list);
        this.dispatchEvent("when-block-list-changed");
      } else {
        this.block_list = list;
        this.dispatchEvent("when-block-list-changed");
        block_list_config.has_more = list.length == block_list_config.pageSize;

        // 根据返回的高度，对page进行重置
        const last_block = list[list.length - 1];
        if (last_block) {
          const height = last_block.height;
          block_list_config.page =
            Math.round(height / block_list_config.pageSize) + 1; // +1代表当前的页
        } else {
          block_list_config.page = 1;
        }
      }
    } finally {
      block_list_config.loading = false;
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
    this.dispatchEvent("when-block-list-changed");
    if (
      filtered_block_list.length !== block_list.length &&
      filtered_block_list.length < block_list_config.pageSize / 2
    ) {
      // 执行了过滤，需要加载更多的数据
      return this.loadMoreBlockList();
    }
  }
  blockListTrackByFn(index, item: BlockModel) {
    return item.height;
  }

  /** TODO：切换可用节点，或者寻找新的可用节点，然后开始重新执行这个函数
   *  这点应该做成一个peerService中提供的通用catchErrorAndReLinkPeerThenRetryTask修饰器
   */

  @TabChainPage.addEvent("HEIGHT:CHANGED")
  @asyncCtrlGenerator.error(
    "更新区块链失败，重试次数过多，已停止重试，请检测网络",
  )
  @asyncCtrlGenerator.retry()
  async watchHeightChange(height) {
    if (this.block_list.length === 0) {
      await this.loadBlockList();
    } else {
      const tasks: Promise<any>[] = [];
      const current_length = this.block_list[0].height;
      // TODO：暂停预期块的动画=>实现块进入的动画=>再次开启预期块的动画
      if (current_length < height) {
        // 增量更新
        tasks[tasks.length] = this.loadBlockList({
          increment: true,
          increment_length: height - current_length,
        });
        tasks[tasks.length] = this.loadUnconfirmBlock();
      }
      await Promise.all(tasks);
    }
  }

  showing_block_list: Array<BlockModel> = [];
  private showlist_bind_info = {
    from_index: 0,
    current_index: 0,
    end_index: 0,
    height: 0,
  };
  @TabChainPage.addEvent("when-block-list-changed")
  @TabChainPage.willEnter
  bindShowingBlockList() {
    const { showlist_bind_info, block_list_config } = this;
    if (this.showing_block_list.length === 0) {
      this.showing_block_list = this.block_list.slice(
        0,
        block_list_config.pageSize * 2,
      );
    } else {
      const center_block_info = this._getViewCenterBlock();
      if (!center_block_info.height) {
        return;
      }
      const height = center_block_info.height;
      const first_height = this.block_list[0].height;
      const current_index = first_height - height;
      let from_index = current_index - block_list_config.pageSize;
      let end_index = current_index + block_list_config.pageSize;
      if (from_index < 0) {
        end_index -= from_index;
        from_index = 0;
      }
      if (end_index > this.block_list.length) {
        const more_length = end_index - this.block_list.length;
        end_index = this.block_list.length;
        from_index -= more_length;
        if (from_index < 0) {
          from_index = 0;
        }
      }

      if (
        // 视野中间的block是同一个
        showlist_bind_info.height === height &&
        // 且中间的这个区块与算出的起点距离没有发生改变，等于我不在列表的最前面，当前面发生了插入我不也不用在意
        showlist_bind_info.current_index - showlist_bind_info.from_index ===
        current_index - from_index &&
        // 还有与终点的距离
        showlist_bind_info.end_index - showlist_bind_info.current_index ===
        end_index - current_index
      ) {
        // console.log(
        //   "%c不需要更新 showing_block_list",
        //   "color:green;background-color:#ddd",
        // );
        return;
      }
      this.showlist_bind_info = {
        from_index,
        current_index,
        end_index,
        height,
      };
      // console.log(
      //   "%c更新 showing_block_list",
      //   "color:orange;background-color:#ddd",
      //   this.showlist_bind_info,
      // );
      const from_offset_top = center_block_info.ele.offsetTop;
      if (this.content) {
        console.log(from_offset_top , this.content.scrollHeight)
        // console.log(from_offset_top, this.content && this.content.scrollHeight)
        if (from_offset_top > this.content.scrollHeight) {
          // 跟随当前元素进行滚动
          console.log('跟随当前元素进行滚动')
          requestAnimationFrame(() => {
            const cur_offset_top = center_block_info.ele.offsetTop;
            if (this.content) {
              const diff_offset_top = cur_offset_top - from_offset_top;
              if (diff_offset_top) {
                this.content.scrollTo(
                  0,
                  this.content.scrollTop + diff_offset_top,
                  0,
                );
              }
            }
          });
        } else {// 如果处于前面，默认为查看最新区块的模式，所以锁定滚动高度。
          console.log('锁定滚动高度')
          const cur_scroll_top = this.content.scrollTop;
          requestAnimationFrame(() => {
            if (this.content) {
              this.content.scrollTo(0, cur_scroll_top, 0);
            }
          });
        }
      }
      this.showing_block_list = this.block_list.slice(from_index, end_index);
    }
  }
  @TabChainPage.autoUnsubscribe _content_scroll_subscription?: Subscription;
  private _content_scroll_refresh_showing_list_ti: any;
  @TabChainPage.didEnter
  whenContentScroll() {
    if (!this.content) {
      return;
    }

    this._content_scroll_subscription = this.content.ionScroll.subscribe(
      scroll_info => {
        if (this._content_scroll_refresh_showing_list_ti) {
          return;
        }
        this._content_scroll_refresh_showing_list_ti = setTimeout(() => {
          this.bindShowingBlockList();
          this._content_scroll_refresh_showing_list_ti = null;
        }, 160);
      },
    );
  }

  private _getViewCenterBlock() {
    var ele = document.elementFromPoint(
      document.body.clientWidth / 2,
      document.body.clientHeight / 2,
    ) as HTMLElement;
    while (!ele.classList.contains("block-item")) {
      if (ele.parentElement) {
        ele = ele.parentElement;
      } else {
        break;
      }
    }
    return {
      ele,
      height: parseFloat(ele.dataset["height"] as string),
    };
  }
}
