import {
  ViewChild,
  Component,
  Optional,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { sleep } from "../../../bnqkl-framework/PromiseExtends";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
} from "ionic-angular";
import {
  AssetsServiceProvider,
  AssetsModel,
  AssetsPossessorModel,
  AssetsModelWithLogoSafeUrl,
} from "../../../providers/assets-service/assets-service";
import { ChangeEvent, VirtualScrollComponent } from "angular2-virtual-scroll";

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
    this.initAssetsOwnerRank();
  }

  @AssetsAssetsDetailPage.markForCheck owner_list: AssetsPossessorModel[] = [];
  page_info = {
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
    this.page_info.page = 1;
    // this.owner_list = this.mixArrayByUnshift(
    // 	this.owner_list,
    // 	await this._loadAssetsOwnerRank(),
    // 	{
    // 		mix_key: "address",
    // 	},
    // );
    this.owner_list = await this._loadAssetsOwnerRank();
  }
  /**加载更多排名列表*/
  @asyncCtrlGenerator.error()
  async loadMoreAssetsOwnerRank() {
    if (!this.page_info.hasMore) {
      return;
    }
    this.page_info.page += 1;
    this.owner_list = this.owner_list.concat(await this._loadAssetsOwnerRank());
    // this.owner_list = this.mixArrayByPush(
    // 	this.owner_list,
    // 	await this._loadAssetsOwnerRank(),
    // 	{
    // 		mix_key: "address",
    // 	},
    // );
  }
  /**虚拟滚动辅助函数*/
  async onOwnerListChange(event: ChangeEvent) {
    if (event.end !== this.owner_list.length) return;
    if (this.page_info.loading || !this.page_info.hasMore) {
      return;
    }
    await this.loadMoreAssetsOwnerRank();
  }

  private async _loadAssetsOwnerRank() {
    const { page_info, assets_info } = this;
    if (!assets_info) {
      return [];
    }
    page_info.loading = true;
    try {
      const offset = (page_info.page - 1) * page_info.pageSize;
      const list = await this.assetsService.getAssetsOwnerList({
        offset,
        limit: page_info.pageSize,
        abbreviation: assets_info.abbreviation,
      });
      page_info.hasMore = list.length >= page_info.pageSize;
      list.forEach((item, i) => (item["_ranking"] = i + offset + 1));
      return list;
    } finally {
      page_info.loading = false;
    }
  }

  @AssetsAssetsDetailPage.addEvent("HEIGHT:CHANGED")
  watchHeightChanged() {
    this.initAssetsOwnerRank();
  }

  async confirmToDestoryAssets() {
    await this.showConfirmDialog("@@CONFIM_TO_DESTORY_ASSETS", () => {
      this.destoryAssets();
    });
  }
  async destoryAssets() {
    const { custom_fee, password, pay_pwd } = await this.getUserPassword({
      custom_fee: true,
    });

    return this.assetsService.destoryAssets(
      this.assets_info,
      custom_fee,
      password,
      pay_pwd
    );
  }
}
