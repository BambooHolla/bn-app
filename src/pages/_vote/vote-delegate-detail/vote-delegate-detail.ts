import {
  Component,
  Optional,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams, Refresher } from "ionic-angular";
import {
  BlockServiceProvider,
  BlockModel,
  ForgingBlockModel,
} from "../../../providers/block-service/block-service";
import {
  MinServiceProvider,
  DelegateModel,
} from "../../../providers/min-service/min-service";

@IonicPage({ name: "vote-delegate-detail" })
@Component({
  selector: "page-vote-delegate-detail",
  templateUrl: "vote-delegate-detail.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteDelegateDetailPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public blockService: BlockServiceProvider,
    public minService: MinServiceProvider,
    public cdRef: ChangeDetectorRef,
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  delegate_info?: DelegateModel;
  current_info_round: number = 0;
  @VoteDelegateDetailPage.willEnter
  async initData() {
    const delegate_info = this.navParams.get("delegate_info");
    if (!delegate_info) {
      this.navCtrl.goToRoot({});
      return;
    }
    this.delegate_info = delegate_info;
    this.current_info_round = this.appSetting.getRound();
  }

  async loadMoreBlockList() {
    const { page_info } = this;
    if (page_info.loading) {
      return;
    }
    page_info.page += 1;
    const forgin_blocks = await this._getForginBlocks();
    this.forgin_block_list.push(...forgin_blocks);
  }

  page_info = {
    page: 0,
    pageSize: 20,
    loading: false,
    hasMore: true,
  };
  forgin_block_list: ForgingBlockModel[] = [];

  total_vote = Infinity;
  @VoteDelegateDetailPage.addEvent("ROUND:CHANGED")
  async watchRoundChanged() {
    this.total_vote = await this.minService.totalVote.getPromise();
  }

  @VoteDelegateDetailPage.addEvent("HEIGHT:CHANGED")
  async watchHeightChanged() {
    if (!this.delegate_info) {
      return;
    }
    const old_producedblocks = this.delegate_info.producedblocks;
    if (this.current_info_round !== this.appSetting.getRound()) {
      this.delegate_info = await this.minService.getDelegateInfo(
        this.delegate_info.publicKey,
      );
    }
    const new_producedblocks = this.delegate_info.producedblocks;
    if (
      new_producedblocks === old_producedblocks &&
      this.forgin_block_list.length > 0
    ) {
      return;
    }
    // 重新开始分页加载
    this.page_info.page = 0;
    this.forgin_block_list = await this._getForginBlocks();
  }
  @asyncCtrlGenerator.error("@@GET_FORGIN_BLOCK_ERROR")
  private async _getForginBlocks() {
    const { page_info } = this;
    page_info.loading = true;
    try {
      const forgin_blocks_info = await this.blockService.getForgingByPage(
        (this.delegate_info as DelegateModel).publicKey,
        page_info.page,
        page_info.pageSize,
      );
      page_info.hasMore =
        forgin_blocks_info.blocks.length === page_info.pageSize;
      return forgin_blocks_info.blocks;
    } finally {
      page_info.loading = false;
    }
  }
}
