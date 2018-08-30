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
console.log(lottie);

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

	@ViewChild(Slides) slides!: Slides;
	@AssetsGuidePage.willEnter
	initAni() {
		this.runAni(this.slides.getActiveIndex());
	}
	slideChanged() {
		const index = this.slides.getActiveIndex();
		this.stopAni(index - 1);
		this.stopAni(index + 1);
		this.runAni(index);
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
	private _lottie_opts: any[] = [
		{},
		{},
		{},
		{},
		{},
		{ extends_fun: "initBootstrapButton" },
	];
	runAni(index) {
		let ani_ins = this._lottie_ins_map.get(index);
		if (!ani_ins) {
			const ele = (this.elementRef
				.nativeElement as HTMLElement).querySelector(
				`.s-${index + 1} .ani-conatiner`
			);
			if (!ele) {
				return;
			}
			const opt = this._lottie_opts[index];
			ani_ins = lottie.loadAnimation({
				container: ele, // Required
				path: `./assets/assets-guide/${("0" + (index + 1)).substr(
					-2
				)}/data.json`, // Required
				renderer: "svg", // Required
				loop: true, // Optional
				autoplay: true, // Optional
				name: `assets guide ${index + 1}`, // Name for future reference. Optional.
				...opt,
			});
			this._lottie_ins_map.set(index, ani_ins);
			if (opt.extends_fun) {
				this[opt.extends_fun]({ ele, index, ani_ins });
			}
			// ani_ins.play();
		} else {
			// if (ani_ins.isPaused) {
			// 	ani_ins.goToAndPlay(0);
			// }
			ani_ins.play();
		}
		console.log(ani_ins);
		return ani_ins;
	}
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
			this.finishJob(true);
		});
	}
}
