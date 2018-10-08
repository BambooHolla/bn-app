import { ViewChild, Component, Optional, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { IonicPage, NavController, NavParams, ViewController } from "ionic-angular";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { sleep } from "../../../bnqkl-framework/PromiseExtends";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";

@IonicPage({ name: "subchain-world" })
@Component({
	selector: "page-subchain-world",
	templateUrl: "subchain-world.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubchainWorldPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public cdRef: ChangeDetectorRef,
		public viewCtrl: ViewController
	) {
		super(navCtrl, navParams, true, tabs);
	}

	subchain_list = Array.from({ length: 20 }, _ => {
		return {
			abbreviation: Array((3 + Math.random() * 2) | 0)
				.fill("")
				.map(_ => String.fromCharCode(Math.floor(Math.random() * 27) + 65))
				.join(""),
		};
	});

	routeToSubchainGateway(subchain, e: TouchEvent | MouseEvent) {
		const touchPos = {
			x: 0,
			y: 0,
		};
		if ("touches" in e) {
			const touchPoint = e.touches[0];
			touchPos.x = touchPoint.clientX;
			touchPos.y = touchPoint.clientY;
		} else {
			touchPos.x = e.clientX;
			touchPos.y = e.clientY;
		}
		this.routeTo(
			"subchain-gateway",
			{ touchPos },
			{
				animation: "ripple-transition",
				touchPos,
			}
		);
	}
}
