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
  AccountServiceProvider,
  AccountRoundProfitModel,
} from "../../providers/account-service/account-service";

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
  constructor(
    cdRef: ChangeDetectorRef,
    public accountService: AccountServiceProvider,
  ) {
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

  income_trend_blist: AccountRoundProfitModel[] = [];
  page_info = {
    page: 1,
    pageSize: 20,
    round: 0,
    loading: false,
    hasMore: true,
  };
  async refreshDetailData() {
    const cur_round = this.appSetting.getRound();
    const { page_info } = this;
    if (cur_round === page_info.round) {
      return;
    }
    page_info.page = 1;
    this.income_trend_blist = await this.loadMoreIncomeTrendList();
    page_info.round = cur_round;
  }
  async loadMoreIncomeTrendList() {
    const { page_info } = this;
    page_info.loading = true;
    try {
      const data = await this.accountService.getAccountPreRoundProfits(
        this.userInfo.address,
        page_info.page,
        page_info.pageSize,
      );
      page_info.hasMore = data.profits.length === page_info.pageSize;
      return data.profits;
    } finally {
      page_info.loading = false;
    }
  }
  async onListChange(event: ChangeEvent) {
    if (event.end !== this.income_trend_blist.length) return;
    if (this.page_info.loading || !this.page_info.hasMore) {
      return;
    }
    this.page_info.page += 1;
    const list = await this.loadMoreIncomeTrendList();
    this.income_trend_blist.push(...list);
  }
}
