import { ViewChild, ElementRef, Component, Optional, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { IonicPage, NavController, NavParams, ViewController } from "ionic-angular";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { sleep } from "../../../bnqkl-framework/PromiseExtends";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { SwirlGatewayComponent } from "../../../components/swirl-gateway/swirl-gateway";

@IonicPage({ name: "subchain-gateway" })
@Component({
	selector: "page-subchain-gateway",
	templateUrl: "subchain-gateway.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubchainGatewayPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public cdRef: ChangeDetectorRef,
		public viewCtrl: ViewController
	) {
		super(navCtrl, navParams, true, tabs);
	}

	@ViewChild(SwirlGatewayComponent) swirlGateway?: SwirlGatewayComponent;
}
