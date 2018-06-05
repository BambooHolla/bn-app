import {
	Component,
	Optional,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
} from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import {
	IonicPage,
	NavController,
	NavParams,
	ViewController,
} from "ionic-angular";

@IonicPage({ name: "account-voucher-wallet" })
@Component({
	selector: "page-account-voucher-wallet",
	templateUrl: "account-voucher-wallet.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountVoucherWalletPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public viewCtrl: ViewController,
		public cdRef: ChangeDetectorRef,
	) {
		super(navCtrl, navParams, true, tabs);
	}
}
