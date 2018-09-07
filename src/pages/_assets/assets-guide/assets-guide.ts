import {
	ViewChild,
	Component,
	Optional,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	ElementRef,
	OnDestroy,
} from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { sleep } from "../../../bnqkl-framework/PromiseExtends";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { preLoadImages } from "../../../components/AniBase";
import { TabsPage } from "../../tabs/tabs";
import {
	IonicPage,
	NavController,
	NavParams,
	ViewController,
	Slides,
} from "ionic-angular";
import {
	AssetsServiceProvider,
	AssetsModel,
	AssetsModelWithLogoSafeUrl,
} from "../../../providers/assets-service/assets-service";
import * as lottie from "lottie-web";

@IonicPage({ name: "assets-guide" })
@Component({
	selector: "page-assets-guide",
	templateUrl: "assets-guide.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetsGuidePage extends SecondLevelPage implements OnDestroy {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public cdRef: ChangeDetectorRef,
		public viewCtrl: ViewController,
		public assetsService: AssetsServiceProvider,
		public elementRef: ElementRef
	) {
		super(navCtrl, navParams, true, tabs);
	}
	closeModal() {
		this.viewCtrl.dismiss();
	}

	@ViewChild(Slides) slides!: Slides;
	@AssetsGuidePage.willEnter
	initAni() {
		const index = this.slides.getActiveIndex();
		this.runAni(index);

		// 自动初始化第二个slide
		AssetsGuidePage.preLoadAssets(index + 1).then(() => {
			this.initAniInstance(index + 1);
			/// 开始预加载资源文件
			this.autoFetchNextAssets(index + 2);
		});
	}
	async autoFetchNextAssets(index: number) {
		let assets_index = index;
		let can_load = true;
		while (can_load) {
			can_load = await AssetsGuidePage.preLoadAssets(assets_index);
			assets_index += 1;
		}
	}

	slideChanged() {
		const index = this.slides.getActiveIndex();
		this.stopAni(index - 1);
		this.stopAni(index + 1);
		this.runAni(index);
		// 自动初始化下一个
		this.initAniInstance(index + 1);
	}
	slideToNext() {
		this.slides.slideNext();
	}
	@AssetsGuidePage.markForCheck private _slide_changing = false;
	slideNextStart() {
		console.log("NextStart");
		this._slide_changing = true;
	}
	slideNextEnd() {
		console.log("NextEnd");
		this._slide_changing = false;
	}

	private _lottie_ins_map = new Map();
	/**初始化指定slide的动画*/
	initAniInstance(index: number) {
		if (index >= AssetsGuidePage.lottie_opts.length) {
			return;
		}
		let ani_ins = this._lottie_ins_map.get(index);
		if (!ani_ins) {
			const ele = (this.elementRef
				.nativeElement as HTMLElement).querySelector(
				`.s-${index + 1} .ani-conatiner`
			);
			if (!ele) {
				throw new Error(
					`slide ${index} init error, container not found.`
				);
			}
			const opt = AssetsGuidePage.lottie_opts[index];
			ani_ins = lottie.loadAnimation({
				container: ele, // Required
				path: `./assets/assets-guide/${("0" + (index + 1)).substr(
					-2
				)}/data.json`, // Required
				renderer: "svg", // Required
				loop: true, // Optional
				autoplay: false, // Optional
				name: `assets guide ${index + 1}`, // Name for future reference. Optional.
				...opt,
			});
			this._lottie_ins_map.set(index, ani_ins);
			if (opt.extends_fun) {
				this[opt.extends_fun]({ ele, index, ani_ins });
			}
		}
		return ani_ins;
	}
	/**运作指定slide的动画*/
	runAni(index) {
		console.log("RUN ANI:", index);
		const ani_ins = this.initAniInstance(index);
		if (ani_ins) {
			ani_ins.play();
		}
		return ani_ins;
	}
	/**停止指定slide的动画*/
	stopAni(index) {
		const ani_ins = this._lottie_ins_map.get(index);
		if (!ani_ins || ani_ins.isPaused) {
			return;
		}
		ani_ins.pause();
	}

	ngOnDestroy() {
		for (var ani_ins of this._lottie_ins_map.values()) {
			ani_ins.destroy();
		}
		this._lottie_ins_map.clear();
	}

	initBootstrapButton({ ele }) {
		const btn_container: HTMLElement = ele.parentElement.querySelector(
			`.bootstrap-button-container`
		);
		const ani_btn = lottie.loadAnimation({
			container: btn_container, // Required
			path: `./assets/assets-guide/bootstrap-button/data.json`, // Required
			renderer: "svg", // Required
			loop: false, // Optional
			autoplay: false, // Optional
			name: `bootstrap button`, // Name for future reference. Optional.
		});
		this._lottie_ins_map.set("bootstrap-button", ani_btn);
		ani_btn.addEventListener("DOMLoaded", () => {
			const btn_ele = btn_container.querySelector("g");
			if (btn_ele) {
				let is_played = false;
				btn_ele.addEventListener("click", () => {
					if (is_played) {
						return;
					}
					is_played = true;
					ani_btn.play();
				});
			}
		});
		ani_btn.addEventListener("complete", () => {
			// this.routeTo('assets-issusing-assets',{force_route_in:true})
			this.jobRes(true);
			this.finishJob(true, 1);
		});
	}

	/**动画资源与配置*/
	static lottie_assets_base_url = "./assets/assets-guide/";
	static lottie_opts: any[] = [
		{
			renderer: "canvas",
			assets_list: ["01/images/01-____.png", "01/images/01-_____0.png"],
		},
		{
			renderer: "canvas",
			assets_list: [
				"02/images/01-____-01.png",
				"02/images/01-_____-01.png",
				"02/images/01-_____1-01.png",
				"02/images/01-_____1___-01.png",
				"02/images/01-_____2___-01.png",
				"02/images/01-________1.png",
				"02/images/01-________2.png",
				"02/images/01-________3.png",
				"02/images/01-________4.png",
			],
		},
		{
			assets_list: [
				"03/images/03-______.png",
				"03/images/03-_______0__.png",
				"03/images/03-_______1__.png",
				"03/images/03-_______2__.png",
				"03/images/03-_______3_.png",
			],
		},
		{
			assets_list: [
				"04/images/03-________.png",
				"04/images/03-_________1.png",
				"04/images/04-____.png",
				"04/images/04-_____01.png",
				"04/images/04-_____2____.png",
				"04/images/04-_____3__.png",
				"04/images/04-_____4__1.png",
				"04/images/04-_____5__2.png",
				"04/images/04-_____6__3.png",
			],
		},
		{
			assets_list: [
				"05/images/04-____.png",
				"05/images/04-_____01.png",
				"05/images/05-______1.png",
				"05/images/05-______2.png",
				"05/images/05-______4.png",
				"05/images/05-______5.png",
			],
		},
		{
			renderer: "canvas",
			extends_fun: "initBootstrapButton",
			assets_list: [
				"06/images/______bit_logo.png",
				"06/images/______bit_logo1-1.png",
				"06/images/______bit_logo1-2.png",
				"06/images/________.png",
				"06/images/________1.png",
				"06/images/________2.png",
				"06/images/________3.png",
				"06/images/_________0__.png",
				"06/images/_________10__1.png",
				"06/images/_________11__1.png",
				"06/images/_________12____1.png",
				"06/images/_________13____2.png",
				"06/images/_________14____3.png",
				"06/images/_________15____4.png",
				"06/images/_________16____5.png",
				"06/images/_________17___.png",
				"06/images/_________18____1.png",
				"06/images/_________19____2.png",
				"06/images/_________1__1.png",
				"06/images/_________20____3.png",
				"06/images/_________21.png",
				"06/images/_________21____1.png",
				"06/images/_________22____2.png",
				"06/images/_________23____3.png",
				"06/images/_________24____4.png",
				"06/images/_________25____5.png",
				"06/images/_________26____1-1.png",
				"06/images/_________27____2-1.png",
				"06/images/_________28____3.png",
				"06/images/_________292.png",
				"06/images/_________301.png",
				"06/images/_________31_____2.png",
				"06/images/_________32____.png",
				"06/images/_________33___.png",
				"06/images/_________34____1.png",
				"06/images/_________35____2.png",
				"06/images/_________36____3.png",
				"06/images/_________37.png",
				"06/images/_________37____1-1.png",
				"06/images/_________38____2-1.png",
				"06/images/_________39.png",
				"06/images/_________46.png",
				"06/images/_________55.png",
				"06/images/_________64.png",
				"06/images/_________73.png",
				"06/images/_________82.png",
				"06/images/_________9__.png",
				"06/images/__________1.png",
				"06/images/__________2.png",
				"06/images/__________3.png",
				/// bootstrap-button
				"bootstrap-button/images/________1.png",
				"bootstrap-button/images/________2.png",
				"bootstrap-button/images/________3.png",
				"bootstrap-button/images/__________1.png",
				"bootstrap-button/images/__________2.png",
				"bootstrap-button/images/__________3.png",
			],
		},
	];
	/**预加载某个slide的资源*/
	static async preLoadAssets(index: number) {
		if (AssetsGuidePage.lottie_opts[index]) {
			await Promise.all(
				preLoadImages(
					AssetsGuidePage.lottie_opts[index].assets_list,
					AssetsGuidePage.lottie_assets_base_url
				)
			);
			return true;
		}
		return false;
	}
}

/// 预加载
AssetsGuidePage.preLoadAssets(0);
