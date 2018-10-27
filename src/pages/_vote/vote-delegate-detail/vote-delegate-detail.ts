import { Component, Optional, ChangeDetectorRef, ChangeDetectionStrategy } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { PromisePro } from "../../../bnqkl-framework/PromiseExtends";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams, Refresher } from "ionic-angular/index";
import { BlockServiceProvider, BlockModel, ForgingBlockModel } from "../../../providers/block-service/block-service";
import { MinServiceProvider, DelegateModel, DELEGATE_VOTEABLE } from "../../../providers/min-service/min-service";
import { VoteDelegateDetailBasePage } from "./vote-delegate-detail-base";

@IonicPage({ name: "vote-delegate-detail" })
@Component({
  selector: "page-vote-delegate-detail",
  templateUrl: "vote-delegate-detail.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteDelegateDetailPage extends VoteDelegateDetailBasePage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public blockService: BlockServiceProvider,
    public minService: MinServiceProvider,
    public cdRef: ChangeDetectorRef
  ) {
    super(navCtrl, navParams, tabs, minService, cdRef);
  }

  total_vote = Infinity;
  @VoteDelegateDetailPage.addEvent("ROUND:CHANGED")
  async watchRoundChanged() {
    this.total_vote = await this.minService.totalVote.getPromise();
    // 更新页面
    this.cdRef.markForCheck();
  }

  @VoteDelegateDetailPage.addEvent("HEIGHT:CHANGED")
  async watchHeightChanged() {
    if (!this.delegate_info) {
      return;
    }
    const old_producedblocks = this.delegate_info.producedblocks;
    if (this.current_info_height !== this.appSetting.getHeight()) {
      this.delegate_info = await this.minService.getDelegateInfo(this.delegate_info.publicKey);
    }
    const new_producedblocks = this.delegate_info.producedblocks;
    if (new_producedblocks === old_producedblocks && this.forgin_block_list.length > 0) {
      return;
    }
    // 更新列表数据
    return this.initBlockList();
  }

  //#region 列表数据的加载
  page_info = {
    page: 1,
    pageSize: 20,
    loading: false,
    hasMore: true,
  };
  @VoteDelegateDetailPage.markForCheck
  forgin_block_list: ForgingBlockModel[] = [];
  async initBlockList() {
    // 重新开始分页加载
    this.page_info.page = 1;
    this.forgin_block_list = await this._getForginBlocks();
  }
  async loadMoreBlockList() {
    const { page_info } = this;
    if (page_info.loading || !page_info.hasMore) {
      return;
    }
    page_info.page += 1;
    const forgin_blocks = await this._getForginBlocks();
    this.forgin_block_list = this.forgin_block_list.concat(forgin_blocks);
  }
  @asyncCtrlGenerator.error("@@GET_FORGIN_BLOCK_ERROR")
  private async _getForginBlocks() {
    const delegate_info = await this.wait_delegate_info.promise;
    const { page_info } = this;
    page_info.loading = true;
    try {
      const forgin_blocks_info = await this.blockService.getForgingByPage(delegate_info.publicKey, page_info.page, page_info.pageSize);
      page_info.hasMore = forgin_blocks_info.blocks.length === page_info.pageSize;
      return forgin_blocks_info.blocks;
    } finally {
      page_info.loading = false;
    }
  }
  //#endregion
}
