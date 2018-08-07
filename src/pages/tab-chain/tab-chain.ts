import {
  Component,
  ElementRef,
  ViewChild,
  ViewChildren,
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
import { getQueryVariable } from "../../bnqkl-framework/helper";
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
    public fetch: AppFetchProvider
  ) {
    super(navCtrl, navParams);
    // this.auto_header_shadow_when_scroll_down = true;
    // this.auto_header_progress_when_scrol_down = true;

    this.blockService.event.on("EXPECTBLOCK:CHANGED", expect_block => {
      this.unconfirm_block = expect_block;
    });
    // this.registerViewEvent(this)
  }

  unconfirm_block_mesh_thit = 0xa4a2a3;

  @ViewChild(ChainMeshComponent) chainMesh!: ChainMeshComponent;
  @TabChainPage.markForCheck unconfirm_block?: UnconfirmBlockModel;
  // 在应用启动的时候就需要进行一次数据加载
  @TabChainPage.onInit
  async initUnconfirmBlock() {
    await this.loadUnconfirmBlock();
  }
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
  @TabChainPage.markForCheck chain_list_view_able = false;
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
      this.fixedHeader.nativeElement.clientHeight + 12 /*1rem*/
    );
  }

  pullToTop() {
    this.chainList.setListViewPosY(0, 1000);
  }

  updateBlocks() {
    // TODO: 校验区块的过程中，可能发现错误的区块，而这些区块可能已经被渲染到屏幕上了，需要有一个更新机制来让其获取最新的区块
  }

  // async checkBlockchainCompleteWithNetworkCheck() {
  //   await this.netWorkConnection();
  //   return this.checkBlockchainComplete();
  // }
  // @asyncCtrlGenerator.loading("@@CHECK_BLOCKCHAIN_IS_COMPLETE", undefined, {
  //   cssClass: "can-tap blockchain-loading",
  //   showBackdrop: false,
  // })
  @TabChainPage.onInit
  async checkBlockchainComplete() {
    if (getQueryVariable("AUTO_DOWNLOAD_BLOCKCHAINE") === "disabled") {
      return;
    }
    await this.netWorkConnection();
    const latest_block = await this.blockService.getLastBlock();
    const max_end_height = latest_block.height;
    // 记录第一次同步区块的时间
    if (!this.appSetting.share_settings.is_agree_to_sync_blockchain) {
      await this.waitTipDialogConfirm("@@BEFORE_DOWNLOAD_TIP");
      // 这个点击确认后的is_agree_to_the_agreement_of_sync_blockchain，在区块链正式开始下载后才设置为true
      // this.appSetting.settings.is_agree_to_the_agreement_of_sync_blockchain = true;
    }
    // 开始下载
    this.syncBlockchain(max_end_height);
  }
  @asyncCtrlGenerator.queue()
  async simpleQueue(v) {
    console.log("simpleQueue", v);
    return v;
  }
  @asyncCtrlGenerator.queue({ can_mix_queue: 1 })
  async mixQueue(v) {
    console.log("mixQueue", v);
    return v;
  }

  /*下载进度的相关属性*/
  @TabChainPage.markForCheck is_show_sync_loading = false;
  @TabChainPage.markForCheck sync_progress_blocks = 0;
  @TabChainPage.markForCheck sync_is_verifying_block = false;

  @TabChainPage.onInit
  bindSyncInfo() {
    // 是否在同步区块
    this.registerViewEvent(
      this.appSetting,
      "changed@share_settings.is_syncing_blocks",
      () => {
        this.is_show_sync_loading = this.appSetting.share_settings.is_syncing_blocks;
      },
      true
    );
    // 是否在校验区块
    this.registerViewEvent(
      this.appSetting,
      "changed@share_settings.sync_is_verifying_block",
      () => {
        this.sync_is_verifying_block = this.appSetting.share_settings.sync_is_verifying_block;
      },
      true
    );
    // 同步区块的进度
    this.registerViewEvent(
      this.appSetting,
      "changed@share_settings.sync_progress_blocks",
      () => {
        this.sync_progress_blocks = this.appSetting.share_settings.sync_progress_blocks;
      },
      true
    );
  }

  // private _download_worker?: Worker;
  private _download_task?: PromiseOut<void>;
  /*下载区块链数据*/
  @asyncCtrlGenerator.success("@@DOWNLOAD_BLOCKCHAIN_COMPLETE")
  async syncBlockchain(max_end_height: number) {
    if (this._download_task) {
      return this._download_task.promise;
    }
    let cg;
    try {
      const { worker, req_id, task } = this.blockService.syncBlockChain(
        max_end_height
      );
      this._download_task = task;
      // this._download_worker = worker;
      const onmessage = async e => {
        const msg = e.data;
        // console.log("bs", msg);
        if (msg && msg.req_id === req_id) {
          // 在第一次同意同步区块链的时候，要显示同步窗口
          const firstAutoOpenChainSyncDetail = () => {
            if (!this.appSetting.share_settings.is_agree_to_sync_blockchain) {
              this.appSetting.share_settings.is_agree_to_sync_blockchain = true;
              this.openChainSyncDetail();
            }
          };
          switch (msg.type) {
            // 校验开始，显示协议，并显示 sync-detail
            case "start-verifier":
              if (!this.appSetting.settings.is_known_verifier_will_heat_up) {
                this.appSetting.settings.is_known_verifier_will_heat_up = true;
                await this.waitTipDialogConfirm(
                  "@@VERIFIER_BLOCKCHAIN_WILL_HEAT_UP_TIP"
                ).then(v => {
                  this.appSetting.settings.is_known_verifier_will_heat_up = v;
                });
              }
              // 显示 sync-detail
              firstAutoOpenChainSyncDetail();
              break;
            // 下载开始，显示 sync-detail
            case "start-download":
              firstAutoOpenChainSyncDetail();
              break;
            case "error":
              this.showErrorDialog(
                this.getTranslateSync("SYNC_BLOCKCHAIN_ERROR"),
                "",
                msg.data
              );
              break;
          }
        }
      };
      worker.addEventListener("message", onmessage);
      cg = () => worker.removeEventListener("message", onmessage);

      await task.promise;
    } finally {
      this._download_task = undefined;
      // 并不马上进行cg，可能end-download还没执行
      this.raf(() => {
        cg && cg();
      });
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
  }

  @ViewChild("progressCircle", { read: ElementRef })
  progressCircle!: ElementRef;
  private _progressCircle_rotate = 0;
  _before_markForCheck() {
    if (this.is_show_sync_loading) {
      this._pre_progressCircle_ani_time = performance.now();
      this._progressCircle_rotate = (this._progressCircle_rotate + 45) % 360;
      this.raf(() => {
        (this.progressCircle
          .nativeElement as HTMLElement).style.transform = `rotate(${
          this._progressCircle_rotate
        }deg)`;
      });
      this.cdRef.detectChanges;
    }
  }
  private _auto_aniProgressCircle_ti;
  private _pre_progressCircle_ani_time;
  // 至少每秒要让这个spinner动一次
  @TabChainPage.didEnter
  private _auto_aniProgressCircle() {
    this._auto_aniProgressCircle_ti = setInterval(() => {
      const now = performance.now();
      if (now - this._pre_progressCircle_ani_time >= 490) {
        this._before_markForCheck();
      }
    }, 500);
  }
  @TabChainPage.didLeave
  private _clear_aniProgressCircle() {
    clearInterval(this._auto_aniProgressCircle_ti);
  }

  openChainSyncDetail() {
    this.modalCtrl.create("chain-sync-detail").present();
  }

  showVerifierLoading() {
    // this.loadingCtrl.create("")
  }
  closeVerifierLoading() {}
}
