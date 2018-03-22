import { Component, Input } from "@angular/core";
import { RankModel } from "../../providers/min-service/min-service";
import { BlockServiceProvider } from "../../providers/block-service/block-service";
import { BenefitServiceProvider } from "../../providers/benefit-service/benefit-service";

import {
  VoteExtendsPanelComponent,
  DATA_REFRESH_FREQUENCY,
} from "../VoteExtendsPanelComponent";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";

@Component({
  selector: "vote-current-block-income",
  templateUrl: "vote-current-block-income.html",
})
export class VoteCurrentBlockIncomeComponent extends VoteExtendsPanelComponent {
  @Input("show-detail")
  set show_detail(v) {
    this.setShowDetail(v);
  }
  get show_detail() {
    return this._show_detail;
  }
  constructor(
    public blockService: BlockServiceProvider,
    public benefitService: BenefitServiceProvider,
  ) {
    super();
    this.data_refresh_frequency = DATA_REFRESH_FREQUENCY.BY_HEIGHT;
  }

  cur_round_income_info = {
    round: 0,
    block_num: 0,
    cur_round_income_amount: 0,
    recent_income_amount: 0,
  };
  async refreshBaseData() {
    const tasks: Promise<any>[] = [];
    const { cur_round_income_info } = this;
    cur_round_income_info.round = this.appSetting.getRound();
    tasks[tasks.length] = this.blockService.myForgingCount
      .getPromise()
      .then(v => {
        cur_round_income_info.block_num = v;
      });
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
    return Promise.all(tasks);
  }
  async refreshDetailData() {}
}
