import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";

/**
 * Generated class for the ChainTransactionDetailPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({ name: "chain-transaction-detail" })
@Component({
	selector: "page-chain-transaction-detail",
	templateUrl: "chain-transaction-detail.html",
})
export class ChainTransactionDetailPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
	) {
		super(navCtrl, navParams, true, tabs);
		this.auto_header_shadow_when_scroll_down = true;
	}
	transaction = {
		transfer_id: "qtransfer_idaqqqqqqqqqqqqqqqzzzzzzsdasdasddad",
		block_id: "qblock_idaqqqqqqqqqqqqqqqzzzzzzsdasdasddad",
		amount: Math.random() * 10,
		fee: Math.random() / 10,
		transfer_time: new Date(Date.now()-10*24*60*60*1000*Math.random()),
		sender_address: "qsender_addressaqqqqqqqqqqqqqqqzzzzzzsdasdasddad",
		receiver_address: "qreceiver_addressaqqqqqqqqqqqqqqqzzzzzzsdasdasddad",
	};
}
