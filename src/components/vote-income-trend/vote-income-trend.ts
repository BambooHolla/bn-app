import {
  Component,
  Input,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import {
  BenefitServiceProvider,
  BenefitModel,
} from "../../providers/benefit-service/benefit-service";

import {
  VoteExtendsPanelComponent,
  DATA_REFRESH_FREQUENCY,
} from "../VoteExtendsPanelComponent";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { ChangeEvent, VirtualScrollComponent } from "angular2-virtual-scroll";

@Component({
  selector: "vote-income-trend",
  templateUrl: "vote-income-trend.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteIncomeTrendComponent extends VoteExtendsPanelComponent {
  @Input("show-detail")
  set show_detail(v) {
    if (v) {
      this.data_refresh_frequency = DATA_REFRESH_FREQUENCY.BY_ROUND;
    } else {
      this.data_refresh_frequency = DATA_REFRESH_FREQUENCY.BY_HEIGHT;
    }
    this.setShowDetail(v);
  }
  get show_detail() {
    return this._show_detail;
  }
  constructor(cdRef: ChangeDetectorRef) {
    super(cdRef);
  }

  income_trend_list?: BenefitModel[];

  async refreshBaseData() {
    const income_trend_list =
      (await this.benefitService.topBenefits.getPromise()) || [];
    const income_trend_height_map = new Map<number, BenefitModel>();
    income_trend_list.forEach(i => {
      income_trend_height_map.set(i.height, i);
    });
    const from_height = this.appSetting.getHeight();
    const filled_income_trend_list: BenefitModel[] = [];
    for (let i = 0; i < this.benefitService.top_benefit_size; i += 1) {
      // 填充收益为0的height
      const height = from_height - i;
      const benefit = income_trend_height_map.get(height);
      if (benefit) {
        filled_income_trend_list.push(benefit);
      } else {
        filled_income_trend_list.push({
          address: this.userInfo.address,
          amount: "0",
          blockId: "",
          height,
          timestamp: 0,
          type: "",
          username: this.userInfo.username,
        });
      }
    }
    this.income_trend_list = filled_income_trend_list;
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
