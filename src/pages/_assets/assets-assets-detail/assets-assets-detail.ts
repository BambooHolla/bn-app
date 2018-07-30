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
} from "../../../providers/assets-service/assets-service";

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
		public assetsService: AssetsServiceProvider,
	) {
		super(navCtrl, navParams, true, tabs);
	}


}
