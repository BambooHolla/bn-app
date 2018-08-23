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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  /**我发布的资产*/
  my_issued_assets_list: AssetsModelWithLogoSafeUrl[] = [];

  @AssetsMyAssetsListPage.markForCheck
  /**我持有的资产*/
  my_assets_list: AssetsModelWithLogoSafeUrl[] = [];

  page_info = {
    loading: false,
  };

  @AssetsMyAssetsListPage.willEnter
  initData() {
    if (this._is_from_child) {
      this._is_from_child = false;
      return;
    }
    return this.initMyAssetsList();
  }
  @AssetsMyAssetsListPage.markForCheck
  zzz = 666;
  @AssetsMyAssetsListPage.willEnter
  randomZZZ() {
    setInterval(()=>{
      if(this.PAGE_STATUS < this.PAGE_STATUS_ENUM.DID_LEAVE){
        this.zzz = Math.random();
      }
    },1000)
  }

  // @asyncCtrlGenerator.loading("@@LOADING_MY_ASSETS_LIST", undefined, {
  //   cssClass: "can-tap blockchain-loading",
  // })
  initMyAssetsList() {
    return this.updateMyAssetsList();
  }

  @AssetsMyAssetsListPage.addEventAfterDidEnter("HEIGHT:CHANGED")
  @asyncCtrlGenerator.error()
  updateMyAssetsList() {
    return Promise.all([
      this._loadIssuedAssetsList().then(
        list => (this.my_issued_assets_list = list)
      ),
      this._loadMyAssetsList().then(list => (this.my_assets_list = list)),
    ]);
  }

  private async _loadIssuedAssetsList() {
    return await this.assetsService.getAssets({
      address: this.userInfo.address,
    });
  }

  private async _loadMyAssetsList() {
    const { page_info } = this;
    page_info.loading = true;
    this.markForCheck();
    try {
      const assets_list = await this.assetsService.myAssetsList.getPromise();
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
  routeToAssetsTraList(assets: AssetsModel) {
    this._is_from_child = true;
    this.routeTo("assets-assets-transaction-list", { assets });
  }
}
