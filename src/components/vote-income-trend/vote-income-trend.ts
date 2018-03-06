import { Component, Input } from "@angular/core";
import {
  BenefitServiceProvider,
  BenefitModel,
} from "../../providers/benefit-service/benefit-service";

import { VoteExtendsPanelComponent } from "../VoteExtendsPanelComponent";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";

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
    const income_trend_list = await this.benefitService.top57Benefits.getPromise();
    this.income_trend_list = income_trend_list.length
      ? income_trend_list
      : undefined;
  }
  async refreshDetailData() {}
}
