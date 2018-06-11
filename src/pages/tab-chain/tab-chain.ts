import {
  Component,
  ElementRef,
  ViewChild,
  Renderer2,
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
  ScrollEvent,
  InfiniteScroll,
} from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { PAGE_STATUS } from "../../bnqkl-framework/const";
import {
  BlockServiceProvider,
  BlockModel,
  UnconfirmBlockModel,
} from "../../providers/block-service/block-service";
import { Subscription } from "rxjs/Subscription";
import { ChainMeshComponent } from "../../components/chain-mesh/chain-mesh";
import { ChangeEvent, VirtualScrollComponent } from "angular2-virtual-scroll";

interface FakeBlock extends BlockModel {
  fake: true;
}
const fakeBlock: FakeBlock = {
  fake: true,

  height: 0,
  id: "",
  timestamp: 0,

  version: 0,
  previousBlock: "",
  numberOfTransactions: 0,
  totalAmount: "0",
  totalFee: "0",
  reward: "0",
  payloadLength: 0,
  payloadHash: "",
  generatorPublicKey: "",
  generatorId: "",
  blockSignature: "",
  blockSize: "0",
  confirmations: "",
  totalForged: "0",
};
// @IonicPage({ name: "tab-chain" })
@Component({
  selector: "page-tab-chain",
  templateUrl: "tab-chain.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabChainPage extends FirstLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public blockService: BlockServiceProvider,
    public viewCtrl: ViewController,
    public r2: Renderer2,
    public cdRef: ChangeDetectorRef,
  ) {
    super(navCtrl, navParams);
    // this.auto_header_shadow_when_scroll_down = true;
    // this.auto_header_progress_when_scrol_down = true;
  }

  unconfirm_block_mesh_thit = 0xa4a2a3;

  block_list: Array<BlockModel | FakeBlock> = [];
  block_list_config = {
    loading: false,
    // page: 1,
    pageSize: 20,
    has_more: false,
  };

  @ViewChild(ChainMeshComponent) chainMesh!: ChainMeshComponent;
  unconfirm_block?: UnconfirmBlockModel;
  async loadUnconfirmBlock() {
    this.unconfirm_block = await this.blockService.expectBlockInfo.getPromise();
    this.chainMesh && this.chainMesh.forceRenderOneFrame();
  }

  private _is_into_second_page = false;
  private _into_block?: BlockModel;
  routeToChainBlockDetail(block: BlockModel) {
    this._is_into_second_page = true;
    this._into_block = block;
    this.routeTo("chain-block-detail", { block });
  }

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
    if (this._into_block && this.vscroll) {
      const view_index = this.block_list.indexOf(this._into_block) - 1;
      const view_item = this.block_list[view_index];
      if (view_item) {
        const scrollAnimationTime = this.vscroll.scrollAnimationTime;
        this.vscroll.scrollAnimationTime = 0;
        this.vscroll.scrollInto(view_item);
        this.vscroll.scrollAnimationTime = scrollAnimationTime;
      }
      this._into_block = undefined;
    }
    if (this._is_into_second_page) {
      this._is_into_second_page = false;
      return;
    }
    const { block_list_config, block_list } = this;
    const increment = !!opts.increment;
    if (block_list.length && !opts.force && !increment) {
      // 只初始化加载一次列表
      return;
    }
    // TODO:这里可能需要暂存最后一次请求的函数，只保留最后一次的，然后等完成后，再将最后一次的拿出来执行。
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

      const top_blocks_list = await this.blockService.getTopBlocks(size_length);
      let list: BlockModel[];
      if (increment) {
        // 添加到头部
        list = this.blockService.blockListHandle(
          top_blocks_list,
          undefined,
          this.top_block,
        );
      } else {
        // 整体替换
        list = this.blockService.blockListHandle(top_blocks_list);
      }

      if (increment) {
        // 增量更新
        if (this.block_list[0] === fakeBlock) {
          this.block_list = this.block_list.slice(1);
        }
        this.block_list = list.concat(this.block_list);
        this.dispatchEvent("when-block-list-changed");
      } else {
        this.block_list = list;
        this.dispatchEvent("when-block-list-changed");
        block_list_config.has_more = list.length == block_list_config.pageSize;
      }
      this.block_list.unshift(fakeBlock);
    } finally {
      block_list_config.loading = false;
    }
    // 列表加载完后进行刷新
    this.cdRef.markForCheck();
  }
  @ViewChild("vscroll") vscroll?: VirtualScrollComponent;
  _vscroll_container_ele?: HTMLElement;
  get vSrollContainer() {
    if (this.vscroll) {
      return (
        this._vscroll_container_ele ||
        (this._vscroll_container_ele = ((this.vscroll as any)
          .element as ElementRef).nativeElement as HTMLElement)
      );
    }
  }

  async onListChange(event: ChangeEvent) {
    if (event.end !== this.block_list.length) return;
    await this.loadMoreBlockList();
    this.block_list = this.block_list.slice();
    this.cdRef.markForCheck();
  }
  @asyncCtrlGenerator.error(() =>
    TabChainPage.getTranslate("LOAD_MORE_BLOCK_LIST_ERROR"),
  )
  // 使用retry，实现对断网的控制
  @asyncCtrlGenerator.retry()
  async loadMoreBlockList() {
    const { block_list_config, block_list } = this;
    const min_block = block_list[block_list.length - 1];
    if (!min_block || min_block.height <= 1) {
      return;
    }
    const endHeight = min_block.height - 1;
    const startHeight = Math.max(
      1,
      min_block.height - block_list_config.pageSize,
    );

    const new_block_list = await this.blockService.getBlocksByRange(
      startHeight,
      endHeight,
      -1,
    );
    block_list_config.has_more = startHeight > 1;

    this.block_list.push(...new_block_list);
    this.dispatchEvent("when-block-list-changed");
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
    const tasks: Promise<any>[] = [];

    const top_block = this.top_block;
    if (!top_block) {
      tasks[tasks.length] = this.loadBlockList();
    } else {
      const current_length = top_block.height;
      // TODO：暂停预期块的动画=>实现块进入的动画=>再次开启预期块的动画
      if (current_length < height) {
        // 增量更新
        tasks[tasks.length] = this.loadBlockList({
          increment: true,
          increment_length: height - current_length,
        }).then(() => {
          if (this.vscroll) {
            this.vscroll.refresh();
          }
        });
      }
    }
    tasks[tasks.length] = this.loadUnconfirmBlock();
    await Promise.all(tasks);
    this.cdRef.markForCheck();
  }
  get top_block() {
    for (var i = 0; i < this.block_list.length; i += 1) {
      const block = this.block_list[i];
      if (!block.fake) {
        return block;
      }
    }
  }

  pullToTop() {
    this.vscroll && this.vscroll.scrollInto(this.block_list[0]);
  }
}
