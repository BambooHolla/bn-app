import { Component, Input } from "@angular/core";
import {
  BenefitServiceProvider,
  BenefitModel,
} from "../../providers/benefit-service/benefit-service";

import { VoteExtendsPanelComponent } from "../VoteExtendsPanelComponent";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { ChangeEvent, VirtualScrollComponent } from "angular2-virtual-scroll";

@Component({
  selector: "vote-income-trend",
  templateUrl: "vote-income-trend.html",
})
export class VoteIncomeTrendComponent extends VoteExtendsPanelComponent {
  @Input("show-detail")
  set show_detail(v) {
    this.setShowDetail(v);
  }
  get show_detail() {
    return this._show_detail;
  }
  constructor() {
    super();
  }

  income_trend_list?: BenefitModel[];

  async refreshBaseData() {
    const income_trend_list = await this.benefitService.topBenefits.getPromise();
    this.income_trend_list = income_trend_list.length
      ? income_trend_list
      : undefined;
  }

  income_trend_blist: any[] = [];
  async refreshDetailData() {
    this.income_trend_blist = Array.from({ length: 100 })
      .map((_, i) => {
        return {
          round: i,
          income: 100 * Math.random() * 1e8,
          time: new Date(Date.now() - (101 - i) * 57 * 128e3),
        };
      })
      .reverse();
  }
  async loadMoreIncomeTrendList() {}
  async onListChange(event: ChangeEvent) {
    if (event.end !== this.income_trend_blist.length) return;
    await this.loadMoreIncomeTrendList();
  }
}
