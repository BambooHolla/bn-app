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
import { ChainListComponent } from "../../components/chain-list/chain-list";
import { ChangeEvent, VirtualScrollComponent } from "angular2-virtual-scroll";

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

  @ViewChild(ChainMeshComponent) chainMesh!: ChainMeshComponent;
  unconfirm_block?: UnconfirmBlockModel;
  @TabChainPage.onInit
  async loadUnconfirmBlock() {
    const unconfirm_block = await this.blockService.expectBlockInfo.getPromise();
    this.unconfirm_block = unconfirm_block;
    this.chainMesh && this.chainMesh.forceRenderOneFrame();
    return unconfirm_block.height;
  }

  routeToChainBlockDetail(height: number) {
    this.routeTo("chain-block-detail", { height });
  }

  @ViewChild("fixedHeader") fixedHeader!: ElementRef;
  @ViewChild(ChainListComponent) chainList!: ChainListComponent;
  chain_list_view_able = false;
  @TabChainPage.onInit
  checkChainListViewAble() {
    if (!(this.chain_list_view_able = this.chainList.renderer_started)) {
      this.chainList.once("renderer-started", () => {
        this.chain_list_view_able = true;
      });
    }
  }

  @TabChainPage.didEnter
  initChainListPaddingTop() {
    this.chainList.list_padding_top = this.chainList.pt(
      this.fixedHeader.nativeElement.clientHeight + 12 /*1rem*/,
    );
  }

  pullToTop() {
    this.chainList.setListViewPosY(0, 1000);
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
    if (localStorage.getItem("AUTO_DOWNLOAD_BLOCKCHAINE") === "disabled") {
      return;
    }
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
    };
    this._showCustomDialog(
      {
        // title: this.getTranslateSync("ADVICE"),
        message: this.getTranslateSync("BEFORE_DOWNLOAD_TIP"),
        buttons: [
          {
            text: this.getTranslateSync("CANCEL"),
            cssClass: "cancel",
            handler: download_handler,
          },
          {
            text: this.getTranslateSync("OK_I_KNOWN"),
            cssClass: "ok",
            handler: download_handler,
          },
        ],
      },
      true,
    );
  }

  loading_dialog?: Loading;

  /*显示loading*/
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
  /*关闭loading*/
  @TabChainPage.didLeave
  closeLoading() {
    if (this.loading_dialog) {
      this.loading_dialog.dismiss();
      this.cdRef.markForCheck();
      this.loading_dialog = undefined;
    }
  }
  cur_sync_progres = 0;
  /*改变loading文本*/
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
  /*下载区块链数据*/
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
      const { worker, req_id, task } = this.blockService.downloadBlockInWorker(
        startHeight,
        endHeight,
        max_end_height,
      );
      this._download_task = task;
      // this._download_worker = worker;
      const onmessage = e => {
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

  // TOOD: 不在监听Height change，而是监听区块链change，并刷新页面上的数据
  /** TODO：切换可用节点，或者寻找新的可用节点，然后开始重新执行这个函数
   *  这点应该做成一个peerService中提供的通用catchErrorAndReLinkPeerThenRetryTask修饰器
   */
  // @asyncCtrlGenerator.error(
  //   "更新区块链失败，重试次数过多，已停止重试，请检测网络",
  // )
  // @asyncCtrlGenerator.retry()
  @TabChainPage.addEvent("HEIGHT:CHANGED")
  async watchHeightChange(height) {
    await this.loadUnconfirmBlock();
    this.cdRef.markForCheck();
  }
}
