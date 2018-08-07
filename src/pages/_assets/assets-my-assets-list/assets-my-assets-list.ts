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
  AssetsModelWithLogoSafeUrl,
} from "../../../providers/assets-service/assets-service";

@IonicPage({ name: "assets-my-assets-list" })
@Component({
  selector: "page-assets-my-assets-list",
  templateUrl: "assets-my-assets-list.html",
})
export class AssetsMyAssetsListPage extends SecondLevelPage {
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

  @AssetsMyAssetsListPage.markForCheck
  my_assets_list: AssetsModelWithLogoSafeUrl[] = [];

  page_info = {
    page: 0,
    pageSize: 20,
    hasMore: true,
    loading: false,
  };

  @AssetsMyAssetsListPage.willEnter
  async initData() {
    if (this._is_from_child) {
      this._is_from_child = false;
      return;
    }
    this.page_info.page = 1;
    this.my_assets_list = await this._loadMyAssetsList();
  }

  @asyncCtrlGenerator.error()
  async loadMoreMyAssetsList() {
    if (!this.page_info.hasMore) {
      return;
    }
    if (this.page_info.loading) {
      return;
    }
    this.page_info.page += 1;
    this.my_assets_list.push(...(await this._loadMyAssetsList()));
  }

  private async _loadMyAssetsList() {
    const { page_info } = this;
    page_info.loading = true;
    try {
      const assets_list = await this.assetsService.getAssets({
        address: this.userInfo.address,
        offset: (page_info.page - 1) * page_info.pageSize,
        limit: page_info.pageSize,
      });
      page_info.hasMore = assets_list.length >= page_info.pageSize;
      /*异步查询本地的未确认交易，看是否有销毁信息*/
      return await this.assetsService.mixDestoryingAssets(
        this.userInfo.address,
        assets_list
      );
    } finally {
      page_info.loading = false;
    }
  }

  private _is_from_child = false;
  /**跳转到资产详情页面*/
  routeToAssetsDetail(assets: AssetsModel) {
    this._is_from_child = true;
    this.routeTo("assets-assets-detail", { assets });
  }
}
