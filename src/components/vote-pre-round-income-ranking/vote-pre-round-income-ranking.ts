import {
  Component,
  Input,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import {
  MinServiceProvider,
  RankModel,
} from "../../providers/min-service/min-service";
import { AppSettingProvider } from "../../providers/app-setting/app-setting";

import { VoteExtendsPanelComponent } from "../VoteExtendsPanelComponent";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { ChangeEvent, VirtualScrollComponent } from "angular2-virtual-scroll";
import debug from "debug";
const log = debug("IBT:vote-pre-round-income-ranking");

@Component({
  selector: "vote-pre-round-income-ranking",
  templateUrl: "vote-pre-round-income-ranking.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VotePreRoundIncomeRankingComponent extends VoteExtendsPanelComponent {
  constructor(
    public minService: MinServiceProvider,
    public appSetting: AppSettingProvider,
    cdRef: ChangeDetectorRef
  ) {
    super(cdRef);
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
    this.pre_round_rank_blist = await this.minService.bigRankList.getPromise();
  }

  async routeToDelegate(rank_item: RankModel) {
    const vote = await this.minService.getDelegateInfoByAddress(
      rank_item.address
    );
    log("try to route to delegate: %o", vote);
    if (vote.isDelegate) {
      this.emit("routeTo", "vote-delegate-detail", { delegate_info: vote });
    } else {
      this.emit("routeTo", "account-contact-detail", { address: rank_item.address });
    }
  }
}
