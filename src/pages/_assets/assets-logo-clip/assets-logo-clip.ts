import {
	ViewChild,
	Component,
	Optional,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	ElementRef,
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
		const logo_url = this.navParams.get("logo_url");
		this.clipAssetsLogo.set_logo_url(
			logo_url || "./assets/imgs/net-circle-mask.jpg"
		);
	}

	formData = {
		bgcolor: "#FFFFFF",
	};

	export_clip_logo_url?: SafeUrl;

	rotateClockwise() {
		this.clipAssetsLogo.rotateClockwise90deg();
	}
	rotateCounterclockwise() {
		this.clipAssetsLogo.rotateCounterclockwise90deg();
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
		this.clipAssetsLogo.setBg(this.formData.bgcolor);
	}

	closeModal() {
		this.finishJob();
	}
	@asyncCtrlGenerator.loading()
	@asyncCtrlGenerator.single()
	async exportClip() {
		await sleep(200);
		this.jobRes({
			logo_url: await this.clipAssetsLogo.exportClipBolbUrl(),
		});
		this.finishJob(true);
	}
}
