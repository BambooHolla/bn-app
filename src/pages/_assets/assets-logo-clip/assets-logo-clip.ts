import {
	ViewChild,
	ViewContainerRef,
	Component,
	Optional,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	ElementRef,
	ComponentFactoryResolver,
	ComponentRef,
} from "@angular/core";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { sleep } from "../../../bnqkl-framework/PromiseExtends";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams, ViewController } from "ionic-angular";
import { AssetsServiceProvider, AssetsBaseModel, AssetsModelWithLogoSafeUrl } from "../../../providers/assets-service/assets-service";
import { ClipAssetsLogoComponent } from "../../../components/clip-assets-logo/clip-assets-logo";
import { ClipSubchainLogoComponent } from "../../../components/clip-subchain-logo/clip-subchain-logo";
import { ClipSubchainBannerComponent } from "../../../components/clip-subchain-banner/clip-subchain-banner";

const clipTypeComMap = new Map();
clipTypeComMap.set("assets_logo", ClipAssetsLogoComponent);
clipTypeComMap.set("subchain_logo", ClipSubchainLogoComponent);
clipTypeComMap.set("subchain_banner", ClipSubchainBannerComponent);

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
		public assetsService: AssetsServiceProvider,
		public resolver: ComponentFactoryResolver
	) {
		super(navCtrl, navParams, true, tabs);
	}
	@ViewChild("clipComponent", { read: ViewContainerRef })
	clipViewRef!: ViewContainerRef;
	clipComponentRef!: ComponentRef<ClipAssetsLogoComponent | ClipSubchainLogoComponent | ClipSubchainBannerComponent>;

	@AssetsLogoClipPage.willEnter
	initData() {
		const logo_url = this.navParams.get("logo_url");
		const clip_type = this.navParams.get("clip_type");
		const Com = clipTypeComMap.get(clip_type) || ClipAssetsLogoComponent;
		const factory = this.resolver.resolveComponentFactory<ClipAssetsLogoComponent | ClipSubchainLogoComponent | ClipSubchainBannerComponent>(Com);
		this.clipComponentRef = this.clipViewRef.createComponent(factory);
		this.clipComponentRef.instance.set_logo_url(logo_url || "./assets/imgs/net-circle-mask.jpg");
	}

	formData = {
		bgcolor: "#FFFFFF",
	};

	export_clip_logo_url?: SafeUrl;

	rotateClockwise() {
		this.clipComponentRef.instance.rotateClockwise90deg();
	}
	rotateCounterclockwise() {
		this.clipComponentRef.instance.rotateCounterclockwise90deg();
	}

	private _input_color_ele = document.createElement("input");
	fillBG() {
		if (this._input_color_ele.type !== "color") {
			this._input_color_ele.type = "color";
			this._input_color_ele.onchange = e => {
				this.setLogoBg(this._input_color_ele.value);
			};
		}
		const clickEvent = new MouseEvent("click", {
			view: window,
			bubbles: true,
			cancelable: true,
		});
		this._input_color_ele.dispatchEvent(clickEvent);
	}
	setLogoBg($event) {
		console.log("set logo bg ", $event);
		this.formData.bgcolor = $event;
		this.clipComponentRef.instance.setBg(this.formData.bgcolor);
	}

	closeModal() {
		this.finishJob();
	}
	@asyncCtrlGenerator.loading()
	@asyncCtrlGenerator.single()
	async exportClip() {
		await sleep(200);
		this.jobRes({
			logo_url: await this.clipComponentRef.instance.exportClipBolbUrl(),
		});
		this.finishJob(true);
	}
}
