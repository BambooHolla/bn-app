import { ViewChild, Component, Optional, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { sleep, PromisePro } from "../../../bnqkl-framework/PromiseExtends";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams, ViewController } from "ionic-angular";
import { AssetsServiceProvider, AssetsPossessorModel, AssetsModelWithLogoSafeUrl } from "../../../providers/assets-service/assets-service";
import { BenefitServiceProvider, BenefitModel } from "../../../providers/benefit-service/benefit-service";
import { MinServiceProvider } from "../../../providers/min-service/min-service";
import { TransactionServiceProvider, TransactionModel } from "../../../providers/transaction-service/transaction-service";
import { ChangeEvent, VirtualScrollComponent } from "angular2-virtual-scroll";
import { LocalContactProvider, BenefitWithNicknameModel, TransactionWithNicknameModel } from "../../../providers/local-contact/local-contact";
import { AccountModel } from "../../../providers/account-service/account.types";

@IonicPage({ name: "assets-assets-detail" })
@Component({
  selector: "page-assets-assets-detail",
  templateUrl: "assets-assets-detail.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetsAssetsDetailPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public cdRef: ChangeDetectorRef,
    public viewCtrl: ViewController,
    public localContact: LocalContactProvider,
    public benefitService: BenefitServiceProvider,
    public transactionService: TransactionServiceProvider,
    public minService: MinServiceProvider,
    public assetsService: AssetsServiceProvider
  ) {
    super(navCtrl, navParams, true, tabs);
  }

  @AssetsAssetsDetailPage.markForCheck assets_info!: AssetsModelWithLogoSafeUrl;

  @AssetsAssetsDetailPage.willEnter
  initData() {
    const assets_info = this.navParams.get("assets");
    if (!assets_info) {
      return this.navCtrl.goToRoot({});
    }
    this.assets_info = assets_info;
    // this.getIssueAssetsTrsInfo();
    this.updateAssetsInfo();
    this.initAssetsOwnerRank();
    this.initMiningIncomeList();
    this.initDestoryLogList();
    this.getAccessAccountInfo();
  }

  /**更新拥有的数字资产基本信息*/
  @AssetsAssetsDetailPage.addEventAfterDidEnter("HEIGHT:CHANGED")
  async updateAssetsInfo() {
    const { assets_info } = this;
    if (!assets_info) {
      return;
    }
    const my_assets_list = await this.assetsService.myAssetsList.getPromise();
    const newest_assets_info = my_assets_list.find(assets => assets.abbreviation === assets_info.abbreviation);
    if (newest_assets_info) {
      this.assets_info = newest_assets_info;
    }
    // 加载拓展信息
    await Promise.all([this.getRemaingAssets(), this.getRemaingIBT()]);
  }
  // issus_assets_trs_info = new PromisePro<TransactionModel>();
  // /**获取发行数字资产对应的交易的信息*/
  // getIssueAssetsTrsInfo() {
  //   return this.issus_assets_trs_info.follow(
  //     this.transactionService.getTransactionById(this.assets_info.transactionId)
  //   );
  // }

  /// 1.
  assets_extend_info = {
    total_amount: 0,
    remain_amount: 0,
    remain_ratio: 0,
    used_ratio: 0,
    original_frozen_ibts: 0,
  };
  original_frozen_ibts_pro = new PromisePro<number>();
  /**获取数字资产的剩余数量*/
  async getRemaingAssets() {
    const assets_detail_info = await this.assetsService.getAssetsByAbbreviation(this.assets_info.abbreviation);
    if (assets_detail_info) {
      const { assets_extend_info } = this;
      assets_extend_info.total_amount = parseFloat(assets_detail_info.expectedIssuedAssets);
      assets_extend_info.remain_amount = parseFloat(assets_detail_info.remainAssets);
      assets_extend_info.used_ratio = ((parseFloat(assets_detail_info.remainAssets) - assets_extend_info.total_amount) / assets_extend_info.total_amount) * 100;
      assets_extend_info.original_frozen_ibts = parseFloat(assets_detail_info.originalFrozenAssets);
      this.original_frozen_ibts_pro.resolve(assets_extend_info.original_frozen_ibts);
      assets_extend_info.remain_ratio = 100 - assets_extend_info.used_ratio;
      this.markForCheck();
    }
  }

  /// 2.
  account_extend_info = {
    original_frozen_ibts: 0,
    current_balance: 0,
    remain_rate: 0,
  };
  /**获取发行者IBT的数量*/
  async getRemaingIBT() {
    // this;
    const current_account_info = await this.accountService.getAccountByAddress(this.assets_info.address);
    const { account_extend_info } = this;
    account_extend_info.current_balance = parseFloat(current_account_info.balance);
    account_extend_info.original_frozen_ibts = await this.original_frozen_ibts_pro.promise;

    account_extend_info.remain_rate = (account_extend_info.current_balance / account_extend_info.original_frozen_ibts) * 100 || 100;

    this.getMiningInfo();
    this.markForCheck();
  }

  /// 3.
  mining_extend_info = {
    income_amount: 0,
    growth_rate: 0,
  };
  async getMiningInfo() {
    const { account_extend_info, mining_extend_info } = this;
    /// 获取 applyAssetBlockHeight 开始的挖矿收益，对比初始冻结数量算出增长率
    const account_balance_details = await this.minService.countAccountBalanceDetails(this.assets_info.address, {
      startHeight: this.assets_info.applyAssetBlockHeight,
    });
    mining_extend_info.income_amount = parseFloat(account_balance_details);
    mining_extend_info.growth_rate = (mining_extend_info.income_amount / account_extend_info.original_frozen_ibts) * 100;
  }

  /// 4.
  @AssetsAssetsDetailPage.markForCheck access_account_info?: AccountModel;
  async getAccessAccountInfo() {
    this.access_account_info = await this.accountService.getAccountByAddress(this.assets_info.address);
  }

  /// 持有排名
  @AssetsAssetsDetailPage.markForCheck owner_list: AssetsPossessorModel[] = [];
  owner_list_page_info = {
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
  };

  /**初始化排名列表*/
  @AssetsAssetsDetailPage.willEnter
  @asyncCtrlGenerator.single() // 因为被多个逻辑线同时触发，所以这里使用single来合并逻辑线
  @asyncCtrlGenerator.error()
  async initAssetsOwnerRank() {
    this.owner_list_page_info.page = 1;
    this.owner_list = await this._loadAssetsOwnerRank();
  }
  /**加载更多排名列表*/
  @asyncCtrlGenerator.error()
  async loadMoreAssetsOwnerRank() {
    if (!this.owner_list_page_info.hasMore) {
      return;
    }
    this.owner_list_page_info.page += 1;
    this.owner_list = this.owner_list.concat(await this._loadAssetsOwnerRank());
  }
  /**虚拟滚动辅助函数*/
  async onOwnerListChange(event: ChangeEvent) {
    if (event.end !== this.owner_list.length) return;
    if (this.owner_list_page_info.loading || !this.owner_list_page_info.hasMore) {
      return;
    }
    await this.loadMoreAssetsOwnerRank();
  }

  private async _loadAssetsOwnerRank() {
    const { owner_list_page_info, assets_info } = this;
    if (!assets_info) {
      return [];
    }
    owner_list_page_info.loading = true;
    try {
      const offset = (owner_list_page_info.page - 1) * owner_list_page_info.pageSize;
      const list = await this.assetsService.getAssetsOwnerList({
        offset,
        limit: owner_list_page_info.pageSize,
        abbreviation: assets_info.abbreviation,
      });
      owner_list_page_info.hasMore = list.length >= owner_list_page_info.pageSize;
      list.forEach((item, i) => (item["_ranking"] = i + offset + 1));
      return list;
    } finally {
      owner_list_page_info.loading = false;
    }
  }

  /// 挖矿收益清单
  @AssetsAssetsDetailPage.markForCheck mining_income_list: BenefitWithNicknameModel[] = [];
  mining_income_page_info = {
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
  };
  /**初始化挖矿收益清单*/
  @AssetsAssetsDetailPage.willEnter
  @asyncCtrlGenerator.single() // 因为被多个逻辑线同时触发，所以这里使用single来合并逻辑线
  @asyncCtrlGenerator.error()
  async initMiningIncomeList() {
    this.mining_income_page_info.page = 1;
    this.mining_income_list = await this._loadMiningIncomeList();
  }
  /**加载更多排名列表*/
  @asyncCtrlGenerator.error()
  async loadMoreMiningIncomeList() {
    if (!this.mining_income_page_info.hasMore) {
      return;
    }
    this.mining_income_page_info.page += 1;
    this.mining_income_list = this.mining_income_list.concat(await this._loadMiningIncomeList());
  }

  async _loadMiningIncomeList() {
    const { mining_income_page_info } = this;
    mining_income_page_info.loading = true;
    try {
      const source_list = await this.benefitService.getBenefitsByPage(mining_income_page_info.page, mining_income_page_info.pageSize, this.assets_info.address);
      const min_height = this.assets_info.applyAssetBlockHeight;
      const list = source_list.filter(item => {
        return item.height > min_height;
      });

      mining_income_page_info.hasMore = list.length >= mining_income_page_info.pageSize;
      return await this.localContact.formatBenefitWithLoclContactNickname(list);
    } finally {
      mining_income_page_info.loading = false;
    }
  }
  routeToBlockDetail(log: BenefitModel) {
    return this.routeTo("chain-block-detail", { height: log.height }).then(() => (this._is_from_child = true));
  }

  /// 赎回IBT清单（销毁数字资产）
  @AssetsAssetsDetailPage.markForCheck destory_log_list: TransactionWithNicknameModel[] = [];
  destory_log_page_info = {
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
  };
  /**初始化赎回IBT清单*/
  @AssetsAssetsDetailPage.willEnter
  @asyncCtrlGenerator.single() // 因为被多个逻辑线同时触发，所以这里使用single来合并逻辑线
  @asyncCtrlGenerator.error()
  async initDestoryLogList() {
    this.destory_log_page_info.page = 1;
    this.destory_log_list = await this._loadDestoryLogList();
  }
  /**加载更多赎回IBT清单*/
  @asyncCtrlGenerator.error()
  async loadMoreDestoryLogList() {
    if (!this.destory_log_page_info.hasMore) {
      return;
    }
    this.destory_log_page_info.page += 1;
    this.destory_log_list = this.destory_log_list.concat(await this._loadDestoryLogList());
  }

  async _loadDestoryLogList() {
    const { destory_log_page_info } = this;
    destory_log_page_info.loading = true;
    try {
      const list = await this.transactionService.queryTransactionsByPages(
        {
          type: this.transactionService.TransactionTypes.DESTORY_ASSET,
          assetType: this.assets_info.abbreviation,
        },
        { dealDateTime: -1 },
        destory_log_page_info.page,
        destory_log_page_info.pageSize
      );

      destory_log_page_info.hasMore = list.length >= destory_log_page_info.pageSize;
      return await this.localContact.formatTransactionWithLoclContactNickname(list);
    } finally {
      destory_log_page_info.loading = false;
    }
  }
  private _is_from_child = false;
  /**跳转到交易详情页面*/
  routeToTransactionDetail(tran: TransactionModel) {
    return this.routeTo("chain-transaction-detail", { transaction: tran }).then(() => (this._is_from_child = true));
  }

  @AssetsAssetsDetailPage.addEvent("HEIGHT:CHANGED")
  watchHeightChanged() {
    this.initAssetsOwnerRank();
    this.initMiningIncomeList();
    this.initDestoryLogList();
  }

  get enable_destory_assets_button() {
    if (this.assets_info) {
      return parseFloat(this.assets_info["hodingAssets"]) > 0;
    }
    return false;
  }
  @asyncCtrlGenerator.single()
  showDestoryAssetsDialog() {
    return this.modalCtrl
      .create(
        "assets-destory-assets-dialog",
        { assets: this.assets_info },
        {
          enterAnimation: "custom-dialog-pop-in",
          leaveAnimation: "custom-dialog-pop-out",
        }
      )
      .present();
  }
}
