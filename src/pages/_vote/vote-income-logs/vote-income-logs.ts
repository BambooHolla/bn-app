import { Component, Optional } from "@angular/core";
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
})
export class VoteIncomeLogsPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public minService: MinServiceProvider,
    public accountService: AccountServiceProvider,
    public benefitService: BenefitServiceProvider,
  ) {
    super(navCtrl, navParams, true, tabs);
    this.auto_header_shadow_when_scroll_down = true;
  }

  income_log_list: BenefitModel[] = [];
  income_log_list_config = {
    loaded: false,
    page: 1,
    pageSize: 20,
    has_more: true,
  };
  @VoteIncomeLogsPage.willEnter
  @asyncCtrlGenerator.error(() =>
    VoteIncomeLogsPage.getTranslate("LOAD_VOTE_INCOME_LIST_ERROR"),
  )
  @asyncCtrlGenerator.loading(() =>
    VoteIncomeLogsPage.getTranslate("LOADING_VOTE_INCOME_LIST"),
  )
  async loadIncomeLogList(refresher?: Refresher) {
    const { income_log_list_config } = this;
    // 重置分页
    income_log_list_config.page = 1;
    const list = await this.benefitService.getBenefitsByPage(
      income_log_list_config.page,
      income_log_list_config.pageSize,
    );
    this.income_log_list = list;
    income_log_list_config.loaded = true;
    if (refresher) {
      refresher.complete();
    }
  }
  @asyncCtrlGenerator.error(() =>
    VoteIncomeLogsPage.getTranslate("LOAD_MORE_VOTE_INCOME_LIST_ERROR"),
  )
  async loadMoreIncomeLogList() {
    await new Promise(cb => setTimeout(cb, 1000));
    const { income_log_list_config } = this;
    // 重置分页
    income_log_list_config.page += 1;
    const list = await this.benefitService.getBenefitsByPage(
      income_log_list_config.page,
      income_log_list_config.pageSize,
    );
    this.income_log_list.push(...list);
    income_log_list_config.has_more =
      list.length >= income_log_list_config.pageSize;
  }
}
