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
  Loading,
  IonicPage,
  NavController,
  NavParams,
  ViewController,
  ScrollEvent,
  InfiniteScroll,
} from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { PromiseOut } from "../../bnqkl-framework/PromiseExtends";
import { PAGE_STATUS } from "../../bnqkl-framework/const";
import {
  BlockServiceProvider,
  BlockModel,
  SingleBlockModel,
  BlockListResModel,
  UnconfirmBlockModel,
} from "../../providers/block-service/block-service";
import { AppFetchProvider } from "../../providers/app-fetch/app-fetch";
import { Subscription } from "rxjs/Subscription";
import { ChainMeshComponent } from "../../components/chain-mesh/chain-mesh";
import { ChangeEvent, VirtualScrollComponent } from "angular2-virtual-scroll";

interface FakeBlock extends BlockModel {
  fake: true;
}
interface PlaceholderBlock extends BlockModel {
  placeholder: true;
}
const _base_block = {
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
  remark: "",
};
const fakeBlock: FakeBlock = {
  ..._base_block,
  fake: true,
};
const placeholderBlock: PlaceholderBlock = {
  ..._base_block,
  placeholder: true,
}
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
    public fetch: AppFetchProvider,
  ) {
    super(navCtrl, navParams);
    // this.auto_header_shadow_when_scroll_down = true;
    // this.auto_header_progress_when_scrol_down = true;

    this.blockService.event.on("EXPECTBLOCK:CHANGED", expect_block => {
      this.unconfirm_block = expect_block;
      this.cdRef.markForCheck();
    });
  }

  unconfirm_block_mesh_thit = 0xa4a2a3;

  block_list: Array<BlockModel | FakeBlock | PlaceholderBlock> = [];
  block_list_config = {
    loading: false,
    // page: 1,
    pageSize: 20,
    has_more: false,
  };

  @ViewChild(ChainMeshComponent) chainMesh!: ChainMeshComponent;
  unconfirm_block?: UnconfirmBlockModel;
  async loadUnconfirmBlock() {
    const unconfirm_block = await this.blockService.expectBlockInfo.getPromise();
    this.unconfirm_block = unconfirm_block;
    this.chainMesh && this.chainMesh.forceRenderOneFrame();
    return unconfirm_block.height;
  }

  private _is_into_second_page = false;
  private _into_block?: BlockModel;
  routeToChainBlockDetail(block: BlockModel) {
    this._is_into_second_page = true;
    this._into_block = block;
    this.routeTo("chain-block-detail", { block });
  }

  // async checkBlockchainCompleteWithNetworkCheck() {
  //   await this.netWorkConnection();
  //   return this.checkBlockchainComplete();
  // }
  // @asyncCtrlGenerator.loading("@@CHECK_BLOCKCHAIN_IS_COMPLETE", undefined, {
  //   cssClass: "can-tap",
  //   showBackdrop: false,
  // })
  @TabChainPage.onInit
  async checkBlockchainComplete() {
    await this.netWorkConnection();
    // 检测现有数据库中最低的块是否为1
    let block_1:
      | SingleBlockModel
      | undefined = await this.blockService.blockDb.findOne(
        {},
        { sort: { height: 1 } },
      );
    const latest_block = await this.blockService.getLastBlock();
    if (!block_1) {
      block_1 = latest_block;
    }

    if (block_1.height <= 1) {
      return true;
    }
    const startHeight = 1;
    const endHeight = block_1.height;
    const max_end_height = latest_block.height;
    const download_handler = () => {
      // 开始下载
      this.downloadBlock(startHeight, endHeight, max_end_height);
    }
    this._showCustomDialog({
      // title: this.getTranslateSync("ADVICE"),
      message: this.getTranslateSync("BEFORE_DOWNLOAD_TIP"),
      buttons: [
        {
          text: this.getTranslateSync("CANCEL"),
          cssClass: "cancel",
          handler: download_handler,
        }, {
          text: this.getTranslateSync("OK_I_KNOWN"),
          cssClass: "ok",
          handler: download_handler
        }]
    }, true);
  }

  loading_dialog?: Loading;

  @TabChainPage.didEnter
  showLoading() {
    if (this._download_task && !this.loading_dialog) {
      this.loading_dialog = this.loadingCtrl.create({
        cssClass: "can-tap",
        showBackdrop: false,
      });
      this.loading_dialog.present();
      this.setProgress(this.cur_sync_progres);
    }
  }
  @TabChainPage.didLeave
  closeLoading() {
    if (this.loading_dialog) {
      this.loading_dialog.dismiss();
      this.cdRef.markForCheck();
      this.loading_dialog = undefined;
    }
  }
  cur_sync_progres = 0;
  setProgress = async (progress: number) => {
    this.cur_sync_progres = progress;
    if (this.loading_dialog) {
      this.loading_dialog.setContent(
        await this.getTranslate("FULL_BLOCKCHAIN_DOWNLOADING_#PROGRESS#", {
          progress: ("0" + progress.toFixed(2)).substr(-5),
        }),
      );
      this.cdRef.markForCheck();
    }
  };

  // private _download_worker?: Worker;
  private _download_task?: PromiseOut<void>;
  @asyncCtrlGenerator.success("@@DOWNLOAD_BLOCKCHAIN_COMPLETE")
  async downloadBlock(
    startHeight: number,
    endHeight: number,
    max_end_height: number,
  ) {
    if (this._download_task) {
      return this._download_task.promise;
    }
    let cg;
    try {
      const { worker, req_id, task } = this.blockService.downloadBlockInWorker(startHeight, endHeight, max_end_height);
      this._download_task = task;
      // this._download_worker = worker;
      const onmessage = (e) => {
        const msg = e.data;
        if (msg && msg.req_id === req_id) {
          console.log(msg);
          switch (msg.type) {
            case "start-download":
              this.showLoading();
              break;
            case "end-download":
              this.closeLoading();
              // this._download_worker = undefined;
              break;
            case "progress":
              this.setProgress(msg.data);
              break;
          }
        }
      };
      worker.addEventListener("message", onmessage);
      cg = () => worker.removeEventListener("message", onmessage);

      await task.promise;
    } finally {
      this._download_task = undefined;
      cg && cg();
    }
  }

  /*绑定页面的区块链数据更新器*/
  @TabChainPage.onInit
  bindBlockListViewRefresher() {
    // const unconfirm_height = await this.loadUnconfirmBlock();
    this.registerViewEvent(this.blockService.event, "BLOCKCHAIN:CHANGED", )
  }

  // @TabChainPage
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
      let top_blocks_list: BlockModel[];
      // if (increment) {
      //   top_blocks_list = await this.blockService.getTopBlocks(size_length);
      // } else {
      const unconfirm_height = await this.loadUnconfirmBlock();
      const endHeight = unconfirm_height - 1;
      const { top_block } = this;
      const cur_top_height = top_block ? top_block.height : endHeight;
      let startHeight = Math.min(
        cur_top_height + 1,
        endHeight - size_length + 1,
      );
      if (endHeight - startHeight >= 100) {
        // 超过一次性最大的加载数量，
        startHeight = endHeight - 99;
      }

      top_blocks_list = await this.blockService.getBlocksByRange(
        startHeight,
        endHeight,
        -1,
      );
      // }
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

        if (startHeight > cur_top_height + 1) {
          // 这里区块链断链了，斩断后面的链，用最新的
          this.block_list = list;
        } else {
          this.block_list = list.concat(this.block_list);
        }
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

  current_element_index?: number = 0;

  async onListChange(event: ChangeEvent) {
    this.current_element_index = event.end;
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
    const placeholder_block_list = Array.from({
      length: endHeight - startHeight + 1
    }, (_, i) => ({
      ...placeholderBlock, height: startHeight + 1
    }));
    block_list_config.has_more = startHeight > 1;

    this.blockService.getBlocksByRange(
      startHeight,
      endHeight,
      -1,
    ).then((new_block_list) => {
      const { block_list, top_block } = this;
      if (top_block) {
        const max_height = top_block.height;
        const min_height = top_block
        // if(block_list[0])
        for (var i = 0; i < block_list.length; i += 1) {
          const block = block_list[i];
          new_block_list[]
        }
      }
    });

    this.block_list.push(...placeholder_block_list);
    this.dispatchEvent("when-block-list-changed");
  }
  blockListTrackByFn(index, item: BlockModel) {
    return item.height;
  }

  // TOOD: 不在监听Height change，而是监听区块链change，并刷新页面上的数据
  /** TODO：切换可用节点，或者寻找新的可用节点，然后开始重新执行这个函数
   *  这点应该做成一个peerService中提供的通用catchErrorAndReLinkPeerThenRetryTask修饰器
   */
  // @TabChainPage.addEvent("HEIGHT:CHANGED")
  // @asyncCtrlGenerator.error(
  //   "更新区块链失败，重试次数过多，已停止重试，请检测网络",
  // )
  // @asyncCtrlGenerator.retry()
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
  get last_block() {
    const block = this.block_list[this.block_list.length - 1];
    return block.fake ? undefined : block;
  }

  getBlockListByRange(startHeight: number, endHeight: number) {
    const { top_block,block_list,last_block} = this;
    if (top_block && last_block) {
      const max_height = top_block.height;
      const min_height = last_block.height;
      // if(endHeight<max_height&&startHeight>min_height){

      // }
      const from = Math.min(max_height,startHeight);
      const to = Math.max(min_height,endHeight);
      
      const min_height_index = block_list.length - 1;
    }
    return [];
  }

  pullToTop() {
    this.vscroll && this.vscroll.scrollInto(this.block_list[0]);
  }
}
