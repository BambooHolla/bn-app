import {
	ViewChild,
	Component,
	Optional,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	ElementRef,
} from "@angular/core";
import { DomSanitizer,SafeUrl } from "@angular/platform-browser";
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
import { ClipAssetsLogoComponent } from "../../../components/clip-assets-logo/clip-assets-logo";

@IonicPage({ name: "assets-logo-clip" })
@Component({
	selector: "page-assets-logo-clip",
	templateUrl: "assets-logo-clip.html",
})
export class AssetsLogoClipPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public cdRef: ChangeDetectorRef,
		public viewCtrl: ViewController,
		public domSanitizer: DomSanitizer,
		public assetsService: AssetsServiceProvider
	) {
		super(navCtrl, navParams, true, tabs);
	}
	@ViewChild(ClipAssetsLogoComponent)
	clipAssetsLogo!: ClipAssetsLogoComponent;

	@AssetsLogoClipPage.willEnter
	initData() {
		const logo_url = this.navParams.get("logo-url");
		this.clipAssetsLogo.set_logo_url(
			logo_url || "./assets/imgs/net-circle-mask.jpg"
		);
	}

	export_clip_logo_url?:SafeUrl
}
