import {
  Component,
  Input,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import {
  RateOfReturnModel,
  MinServiceProvider,
} from "../../providers/min-service/min-service";
import {
  TransactionServiceProvider,
  TransactionModel,
  TransactionTypes,
} from "../../providers/transaction-service/transaction-service";
import { BlockServiceProvider } from "../../providers/block-service/block-service";

import {
  VoteExtendsPanelComponent,
  DATA_REFRESH_FREQUENCY,
} from "../VoteExtendsPanelComponent";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { FLP_Tool } from "../../bnqkl-framework/FLP_Tool";
import { ChangeEvent, VirtualScrollComponent } from "angular2-virtual-scroll";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "vote-pre-round-income-rate",
  templateUrl: "vote-pre-round-income-rate.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VotePreRoundIncomeRateComponent extends VoteExtendsPanelComponent {
  TransactionTypes = TransactionTypes;
  @FLP_Tool.FromGlobal translate!: TranslateService;
  get localName() {
    return FLP_Tool.formatLocalName(this.translate.currentLang);
  }
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
    public minService: MinServiceProvider,
    cdRef: ChangeDetectorRef,
    public transactionService: TransactionServiceProvider,
    public blockService: BlockServiceProvider
  ) {
    super(cdRef);
  }

  pre_round_income_rate?: RateOfReturnModel;
  async refreshBaseData() {
    this.pre_round_income_rate = (await this.minService.rateOfReturn.getPromise()) || {
      totalBenefit: 0,
      totalFee: 0,
      rateOfReturn: 0,
    };
    return this.pre_round_income_rate;
  }
  private _default_page_info = {
    income_page: 1,
    income_pageSize: this.transactionService
      .default_user_in_transactions_pageSize,
    income_hasMore: false,
    pay_page: 1,
    pay_pageSize: this.transactionService
      .default_user_out_transactions_pageSize,
    pay_hasMore: true,
    loading: false,
    cache_round: 0,
  };
  page_info = {
    ...this._default_page_info,
  };
  pay_list: TransactionModel[] = [];
  income_list: {
    timestamp: string | number;
    amount: string | number;
  }[] = [];
  async refreshDetailData() {
    const { page_info } = this;
    const cur_round = this.appSetting.getRound();
    if (page_info.cache_round === cur_round) {
      return;
    }
    if (page_info.loading) {
      return;
    }
    const [in_tran_list, out_tran_list] = await Promise.all([
      this._loadMyIncomeTransactionsPreRound().then(
        list => (this.income_list = list)
      ),
      this._loadMyPayTransactionsPreRound().then(
        list => (this.pay_list = list)
      ),
    ]);

    page_info.cache_round = cur_round;
  }
  private async _loadMyIncomeTransactionsPreRound() {
    return await this.benefitService.getMySecondLastRoundBenefits();
  }
  private async _loadMyPayTransactionsPreRound() {
    const { page_info } = this;
    const pay_list = await this.transactionService.getUserTransactionsPreRound(
      this.userInfo.address,
      page_info.pay_page,
      page_info.pay_pageSize,
      "out"
    );
    page_info.pay_hasMore = pay_list.length === page_info.pay_pageSize;
    return pay_list;
  }
  async onPayListChange(event: ChangeEvent) {
    if (event.end !== this.pay_list.length) return;
    if (this.page_info.loading || !this.page_info.pay_hasMore) {
      return;
    }
    this.page_info.pay_page += 1;
    const list = await this._loadMyPayTransactionsPreRound();
    this.pay_list.push(...list);
  }
  async onIncomeListChange(event: ChangeEvent) {
    if (event.end !== this.income_list.length) return;
    if (this.page_info.loading || !this.page_info.income_hasMore) {
      return;
    }
    this.page_info.income_page += 1;
    const list = await this._loadMyIncomeTransactionsPreRound();
    this.income_list.push(...list);
  }
}
