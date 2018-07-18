import {
  Component,
  Optional,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams, Refresher } from "ionic-angular";
import { MinServiceProvider } from "../../../providers/min-service/min-service";
import { AccountServiceProvider } from "../../../providers/account-service/account-service";
import {
  BenefitServiceProvider,
  BenefitModel,
} from "../../../providers/benefit-service/benefit-service";

@IonicPage({ name: "vote-income-logs" })
@Component({
  selector: "page-vote-income-logs",
  templateUrl: "vote-income-logs.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteIncomeLogsPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public minService: MinServiceProvider,
    public accountService: AccountServiceProvider,
    public benefitService: BenefitServiceProvider,
    public cdRef: ChangeDetectorRef,
  ) {
    super(navCtrl, navParams, true, tabs);
    this.auto_header_shadow_when_scroll_down = true;
  }
  @VoteIncomeLogsPage.addEvent("HEIGHT:CHANGED")
  watchHeightChanged(height, is_init) {
    this.loadIncomeLogList();
  }

  income_log_list: BenefitModel[] = [];
  income_log_list_config = {
    loading: false,
    page: 1,
    pageSize: 20,
    hasMore: true,
  };
  // @VoteIncomeLogsPage.willEnter
  @asyncCtrlGenerator.error(() =>
    VoteIncomeLogsPage.getTranslate("LOAD_VOTE_INCOME_LIST_ERROR"),
  )
  async loadIncomeLogList() {
    const { income_log_list_config } = this;
    // 重置分页
    income_log_list_config.page = 1;
    const list = await this._getIncomeLogData();
    this.income_log_list = this.mixArrayByUnshift(this.income_log_list, list, {
      mix_key: "height",
    });
    this.markForCheck();
  }
  @asyncCtrlGenerator.error(() =>
    VoteIncomeLogsPage.getTranslate("LOAD_MORE_VOTE_INCOME_LIST_ERROR"),
  )
  async loadMoreIncomeLogList() {
    await new Promise(cb => setTimeout(cb, 1000));
    const { income_log_list_config } = this;
    // 重置分页
    income_log_list_config.page += 1;
    const list = await this._getIncomeLogData();
    this.income_log_list.push(...list);
    this.markForCheck();
  }
  private async _getIncomeLogData() {
    const { income_log_list_config } = this;
    income_log_list_config.loading = true;
    try {
      const list = await this.benefitService.getBenefitsByPage(
        income_log_list_config.page,
        income_log_list_config.pageSize,
      );
      income_log_list_config.hasMore =
        list.length >= income_log_list_config.pageSize;
      return list;
    } finally {
      income_log_list_config.loading = false;
    }
  }

  routeToBlockDetail(log: BenefitModel) {
    this.routeTo("chain-block-detail", { height: log.height });
  }
}
