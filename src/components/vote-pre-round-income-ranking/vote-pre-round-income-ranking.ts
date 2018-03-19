import { Component, Input } from "@angular/core";
import {
  MinServiceProvider,
  RankModel,
} from "../../providers/min-service/min-service";

import { VoteExtendsPanelComponent } from "../VoteExtendsPanelComponent";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { ChangeEvent, VirtualScrollComponent } from "angular2-virtual-scroll";

@Component({
  selector: "vote-pre-round-income-ranking",
  templateUrl: "vote-pre-round-income-ranking.html",
})
export class VotePreRoundIncomeRankingComponent extends VoteExtendsPanelComponent {
  constructor(public minService: MinServiceProvider) {
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
  loading_pre_round_rank_blist = false;
  pre_round_rank_blist: RankModel[] = [];
  async refreshDetailData() {
    this.loading_pre_round_rank_blist = true;
    try {
      const pre_round_rank_list = await this.minService.myRank.getPromise();
      this.pre_round_rank_blist = pre_round_rank_list
        .concat(pre_round_rank_list)
        .concat(pre_round_rank_list)
        .concat(pre_round_rank_list)
        .concat(pre_round_rank_list)
        .concat(pre_round_rank_list)
        .map((r, i) => {
          return { ...r, copyed: true, rate: i + 1 + "" };
        });
    } finally {
      this.loading_pre_round_rank_blist = false;
    }
  }
  async loadMoreRankList() {
    const pre_round_rank_list = await this.minService.myRank.getPromise();
    const append_list = pre_round_rank_list.map((r, i) => {
      return {
        ...r,
        copyed: true,
        rate: this.pre_round_rank_blist.length + i + 1 + "",
      };
    });
    this.pre_round_rank_blist.push(...append_list);
  }
  async onListChange(event: ChangeEvent) {
    if (event.end !== this.pre_round_rank_blist.length) return;
    await this.loadMoreRankList();
    this.pre_round_rank_blist = this.pre_round_rank_blist.slice();
  }
}
