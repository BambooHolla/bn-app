import {
  Component,
  Input,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import {
  MinServiceProvider,
  RankModel,
} from "../../providers/min-service/min-service";
import { AppSettingProvider } from "../../providers/app-setting/app-setting";

import { VoteExtendsPanelComponent } from "../VoteExtendsPanelComponent";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { ChangeEvent, VirtualScrollComponent } from "angular2-virtual-scroll";

@Component({
  selector: "vote-pre-round-income-ranking",
  templateUrl: "vote-pre-round-income-ranking.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VotePreRoundIncomeRankingComponent extends VoteExtendsPanelComponent {
  constructor(
    public minService: MinServiceProvider,
    public appSetting: AppSettingProvider,
    cdRef: ChangeDetectorRef,
  ) {
    super(cdRef);
  }
  @Input("show-detail")
  set show_detail(v) {
    this.setShowDetail(v);
  }
  get show_detail() {
    return this._show_detail;
  }

  loading_pre_round_rank_list = false;
  pre_round_rank_list?: RankModel[];
  async refreshBaseData() {
    this.loading_pre_round_rank_list = true;
    try {
      this.pre_round_rank_list = await this.minService.myRank.getPromise();
    } finally {
      this.loading_pre_round_rank_list = false;
    }
  }

  private _default_page_info = {
    page: 1,
    pageSize: this.minService.default_rank_list_pageSize,
    hasMore: true,
    loading: false,
  };
  page_info = {
    ...this._default_page_info,
  };

  pre_round_rank_blist: RankModel[] = [];
  fetchd_round_info: number = 0;
  async refreshDetailData() {
    const current_round = this.appSetting.getRound();
    // 避免多余的数据刷新
    if (this.fetchd_round_info === current_round) {
      return;
    }
    this.fetchd_round_info = current_round;
    // 重置分页信息
    this.page_info = {
      ...this._default_page_info,
    };
    this.pre_round_rank_blist = [];
    await this._loadDetailData();
  }
  private async _loadDetailData(page = this.page_info.page) {
    this.page_info.loading = true;
    try {
      const list = await this.minService.getRankList(
        page,
        this.page_info.pageSize,
      );
      this.page_info.page = page;
      this.pre_round_rank_blist.push(...list);
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
    if (event.end !== this.pre_round_rank_blist.length) return;
    if (this.page_info.loading || !this.page_info.hasMore) {
      return;
    }
    if (await this._loadMoreRankList()) {
      this.pre_round_rank_blist = this.pre_round_rank_blist.slice();
      this.cdRef.markForCheck();
    }
  }
}
