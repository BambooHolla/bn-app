import {
	ViewChild,
	Component,
	Optional,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
} from "@angular/core";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
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

@IonicPage({ name: "assets-assets-market" })
@Component({
	selector: "page-assets-assets-market",
	templateUrl: "assets-assets-market.html",
})
export class AssetsAssetsMarketPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public cdRef: ChangeDetectorRef,
		public viewCtrl: ViewController,
		public assetsService: AssetsServiceProvider,
		public domSanitizer: DomSanitizer,
	) {
		super(navCtrl, navParams, true, tabs);
	}

	big_card_grid_view_style = {
		cols: "1",
		rowHeight: "388.255:240",
		cssClass: "big-card",
	};
	small_card_grid_view_style = {
		cols: "2",
		rowHeight: "188:226",
		cssClass: "small-card",
	};
	@AssetsAssetsMarketPage.markForCheck
	card_grid_view_style = this.big_card_grid_view_style;

	page_info = {
		page: 1,
		pageSize: 20,
		hasMore: true,
	};
	assets_list: AssetsModelWithLogoSafeUrl[] = [];

	@AssetsAssetsMarketPage.willEnter
	@asyncCtrlGenerator.error()
	@asyncCtrlGenerator.loading()
	async initData() {
		if (this._is_from_child) {
			this._is_from_child = false;
			return;
		}
		this.page_info.page = 1;
		this.assets_list = await this._loadAssetsList();
		this._handleCardGridViewStyle();
	}

	@asyncCtrlGenerator.error()
	async loadMoreAssetsList() {
		if (!this.page_info.hasMore) {
			return;
		}
		this.page_info.page += 1;
		this.assets_list.push(...(await this._loadAssetsList()));
		this._handleCardGridViewStyle();
	}

	private async _loadAssetsList() {
		const { page_info } = this;
		const list = await this.assetsService.getAssets({
			offset: (page_info.page - 1) * page_info.pageSize,
			limit: page_info.pageSize,
			// orderBy:"dateCreated:desc"
		});
		page_info.hasMore = list.length >= page_info.pageSize;
		return list.map(item => {
			return {
				...item,
				logo_url: this.domSanitizer.bypassSecurityTrustUrl(
					URL.createObjectURL(item.logo),
				),
			};
		});
	}
	private _handleCardGridViewStyle() {
		if (this.assets_list.length >= 6) {
			this.card_grid_view_style = this.small_card_grid_view_style;
		} else {
			this.card_grid_view_style = this.big_card_grid_view_style;
		}
	}

	private _is_from_child = false;
	/*跳转到资产详情页面*/
	routeToAssetsDetail(assets: AssetsModel) {
		this._is_from_child = true;
		this.routeTo("assets-assets-detail", { assets });
	}
}
