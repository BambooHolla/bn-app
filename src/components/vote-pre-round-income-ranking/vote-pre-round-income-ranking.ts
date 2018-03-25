import { Component, Input } from "@angular/core";
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
})
export class VotePreRoundIncomeRankingComponent extends VoteExtendsPanelComponent {
  constructor(
    public minService: MinServiceProvider,
    public appSetting: AppSettingProvider,
  ) {
    super();
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
  async refreshDetailData() {
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
  async loadMoreRankList() {
    return await this._loadDetailData(this.page_info.page + 1);
  }
  async onListChange(event: ChangeEvent) {
    if (event.end !== this.pre_round_rank_blist.length) return;
    if (this.page_info.loading || !this.page_info.hasMore) {
      return;
    }
    if (await this.loadMoreRankList()) {
      this.pre_round_rank_blist = this.pre_round_rank_blist.slice();
    }
  }
}
