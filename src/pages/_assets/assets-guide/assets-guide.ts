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
		this.runAni(this.slides.getActiveIndex());
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

	private _lottie_list: any[] = [];
	private _lottie_opts: any[] = [{}, {}, {}, {}, {}];
	runAni(index) {
		let ani_ins = this._lottie_list[index];
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
			this._lottie_list[index] = ani_ins;
			// ani_ins.play();
		} else {
			// if (ani_ins.isPaused) {
			// 	ani_ins.goToAndPlay(0);
			// }
		}
		console.log(ani_ins);
		return ani_ins;
	}

	ngOnDestroy() {
		this._lottie_list.forEach(ani_ins => {
			ani_ins.destroy();
		});
	}
}
