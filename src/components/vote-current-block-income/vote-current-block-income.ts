import {
  Component,
  Input,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import { RankModel } from "../../providers/min-service/min-service";
import { NavController, NavParams } from "ionic-angular/index";
import {
  BlockServiceProvider,
  BlockModel,
  ForgingBlockModel,
} from "../../providers/block-service/block-service";
import { BenefitServiceProvider } from "../../providers/benefit-service/benefit-service";

import {
  VoteExtendsPanelComponent,
  DATA_REFRESH_FREQUENCY,
} from "../VoteExtendsPanelComponent";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { ChangeEvent, VirtualScrollComponent } from "angular2-virtual-scroll";

@Component({
  selector: "vote-current-block-income",
  templateUrl: "vote-current-block-income.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteCurrentBlockIncomeComponent extends VoteExtendsPanelComponent {
  @Input("show-detail")
  set show_detail(v) {
    this.setShowDetail(v);
  }
  get show_detail() {
    return this._show_detail;
  }
  routeTo(page, params) {
    this.navCtrl.push(page, params);
  }
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public blockService: BlockServiceProvider,
    public benefitService: BenefitServiceProvider,
    cdRef: ChangeDetectorRef
  ) {
    super(cdRef);
    this.data_refresh_frequency = DATA_REFRESH_FREQUENCY.BY_HEIGHT;
  }

  cur_round_income_info = {
    round: 0,
    block_num: 0,
    cur_round_income_amount: 0,
    recent_income_amount: 0,
    loading: false,
  };
  async _refreshSameData() {
    const tasks: Promise<any>[] = [];
    const { cur_round_income_info } = this;
    const new_round = this.appSetting.getRound();
    if (cur_round_income_info.round !== new_round) {
      // 轮次发生改变的时候，先把收益额度滞空，避免上一轮的数据还在这一轮显示，照成误会
      cur_round_income_info.cur_round_income_amount = 0;
    }
    cur_round_income_info.round = new_round;

    tasks[
      tasks.length
    ] = this.benefitService.benefitThisRound.getPromise().then(v => {
      cur_round_income_info.cur_round_income_amount = v;
    });
    tasks[tasks.length] = this.benefitService.recentBenefit
      .getPromise()
      .then(v => {
        cur_round_income_info.recent_income_amount = v;
      });
  }
  async refreshBaseData() {
    const tasks: Promise<any>[] = [];
    const { cur_round_income_info } = this;
    cur_round_income_info.loading = true;
    try {
      tasks[tasks.length] = this.blockService.myForgingCount
        .getPromise()
        .then(v => {
          cur_round_income_info.block_num = v;
        });
      tasks[tasks.length] = this._refreshSameData();
      await Promise.all(tasks);
    } finally {
      cur_round_income_info.loading = false;
    }
  }
  private _default_page_info = {
    page: 1,
    pageSize: this.blockService.default_my_forging_pagesize,
    hasMore: true,
    loading: false,
  };
  page_info = {
    ...this._default_page_info,
  };
  my_forging_block_list: ForgingBlockModel[] = [];
  async refreshDetailData() {
    const tasks: Promise<any>[] = [];
    const { cur_round_income_info } = this;
    cur_round_income_info.loading = true;
    // 重置分页信息
    this.page_info = {
      ...this._default_page_info,
    };
    try {
      tasks[tasks.length] = this.blockService.myForgingCount
        .getPromise()
        .then(v => {
          // 如果count没有变，就不需要更新列表
          if (
            v === cur_round_income_info.block_num &&
            !(v !== 0 && this.my_forging_block_list.length === 0)
          ) {
            return false;
          }
          cur_round_income_info.block_num = v;
          this.my_forging_block_list = [];
          this.page_info.page = 1;
          return this._loadDetailData();
        });
      tasks[tasks.length] = this._refreshSameData();
      await Promise.all(tasks);
    } finally {
      cur_round_income_info.loading = false;
    }
  }
  private async _loadDetailData(page = this.page_info.page) {
    this.page_info.loading = true;
    try {
      const list = await this.blockService
        .getMyForgingByPage(page, this.page_info.pageSize)
        .then(data => data.blocks);
      this.page_info.page = page;
      this.my_forging_block_list.push(...list);
      this.page_info.hasMore = list.length === this.page_info.pageSize;
      return this.page_info.hasMore;
    } finally {
      this.page_info.loading = false;
    }
  }
  private async _loadMoreRankList() {
    return await this._loadDetailData(this.page_info.page + 1);
  }
  async onListChange(event: ChangeEvent) {
    if (event.end !== this.my_forging_block_list.length) return;
    if (this.page_info.loading || !this.page_info.hasMore) {
      return;
    }
    if (await this._loadMoreRankList()) {
      this.my_forging_block_list = this.my_forging_block_list.slice();
      this.cdRef.markForCheck();
    }
  }
}
