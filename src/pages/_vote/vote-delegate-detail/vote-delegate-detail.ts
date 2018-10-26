import { Component, Optional, ChangeDetectorRef, ChangeDetectionStrategy } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { PromisePro } from "../../../bnqkl-framework/PromiseExtends";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams, Refresher } from "ionic-angular/index";
import { BlockServiceProvider, BlockModel, ForgingBlockModel } from "../../../providers/block-service/block-service";
import { MinServiceProvider, DelegateModel, DELEGATE_VOTEABLE } from "../../../providers/min-service/min-service";

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
    public cdRef: ChangeDetectorRef
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  _wait_delegate_info?: PromisePro<DelegateModel>;
  get wait_delegate_info() {
    if (!this._wait_delegate_info) {
      this._wait_delegate_info = new PromisePro();
    }
    return this._wait_delegate_info;
  }
  @VoteDelegateDetailPage.markForCheck delegate_info?: DelegateModel;
  @VoteDelegateDetailPage.markForCheck current_info_height: number = 0;
  @VoteDelegateDetailPage.willEnter
  async initData() {
    let delegate_info: DelegateModel = this.navParams.get("delegate_info");
    if (!delegate_info) {
      const publicKey = this.navParams.get("publicKey");
      if (publicKey) {
        delegate_info = await this.minService.getDelegateInfo(publicKey);
      }
    }
    if (!delegate_info) {
      this.wait_delegate_info.reject();
      this.navCtrl.goToRoot({});
      return;
    }
    this.delegate_info = delegate_info;
    this.current_info_height = this.appSetting.getHeight();
    this.wait_delegate_info.resolve(delegate_info);
    // 更新页面
    this.cdRef.markForCheck();
    // 查询委托人是否可以被投票
    await this.checkCanVoteDelegate();
  }

  async loadMoreBlockList() {
    const { page_info } = this;
    if (page_info.loading) {
      return;
    }
    page_info.page += 1;
    const forgin_blocks = await this._getForginBlocks();
    this.forgin_block_list.push(...forgin_blocks);
    // 更新页面
    this.cdRef.markForCheck();
  }

  page_info = {
    page: 1,
    pageSize: 20,
    loading: false,
    hasMore: true,
  };
  forgin_block_list: ForgingBlockModel[] = [];

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
    // 重新开始分页加载
    this.page_info.page = 1;
    this.forgin_block_list = await this._getForginBlocks();
    // 更新页面
    this.cdRef.markForCheck();
  }
  @asyncCtrlGenerator.error("@@GET_FORGIN_BLOCK_ERROR")
  private async _getForginBlocks() {
    await this.wait_delegate_info;
    const { page_info } = this;
    page_info.loading = true;
    try {
      const forgin_blocks_info = await this.blockService.getForgingByPage((this.delegate_info as DelegateModel).publicKey, page_info.page, page_info.pageSize);
      page_info.hasMore = forgin_blocks_info.blocks.length === page_info.pageSize;
      return forgin_blocks_info.blocks;
    } finally {
      page_info.loading = false;
    }
  }

  readonly DELEGATE_VOTEABLE = DELEGATE_VOTEABLE;
  /**委托人可投与否*/
  @VoteDelegateDetailPage.markForCheck delegate_voteable = DELEGATE_VOTEABLE.UNABLE_VOTE;

  /**查询委托人是否可被投票*/
  @VoteDelegateDetailPage.addEvent("HEIGHT:CHANGED")
  @asyncCtrlGenerator.error()
  @asyncCtrlGenerator.single()
  async checkCanVoteDelegate() {
    if (!this.delegate_info) {
      return;
    }
    this.delegate_voteable = DELEGATE_VOTEABLE.CHEKCING;
    try {
      const voteable = (await this.minService.checkDelegateVoteAble([this.delegate_info.address]))[0];
      this.delegate_voteable = voteable ? DELEGATE_VOTEABLE.VOTEABLE : DELEGATE_VOTEABLE.UNABLE_VOTE;
    } catch {
      this.delegate_voteable = DELEGATE_VOTEABLE.VOTEABLE;
    }
  }

  /**对当前委托人进行投票*/
  @asyncCtrlGenerator.error()
  async voteDelegate() {
    const { delegate_info } = this;
    if (!delegate_info) {
      return;
    }
    await this.waitTipDialogConfirm("@@VOTE_ONE_DELEGATE_TIP");
    const form = await this.getUserPassword({
      custom_fee: true,
    });
    await this.minService.tryVote(
      [delegate_info],
      undefined,
      {
        password: form.password,
        pay_pwd: form.pay_pwd,
        fee: form.custom_fee ? form.custom_fee.toString() : undefined,
      },
      this
    );
  }
}
