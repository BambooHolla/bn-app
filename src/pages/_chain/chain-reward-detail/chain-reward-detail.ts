import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import {
	BlockServiceProvider,
	BlockModel,
	SingleBlockModel,
} from "../../../providers/block-service/block-service";
import {
	TransactionModel,
	TransactionTypes,
} from "../../../providers/transaction-service/transaction-service";
import { TimestampPipe } from "../../../pipes/timestamp/timestamp";
import {
	MinServiceProvider,
	DelegateModel,
} from "../../../providers/min-service/min-service";

@IonicPage({ name: "chain-reward-detail" })
@Component({
	selector: "page-chain-reward-detail",
	templateUrl: "chain-reward-detail.html",
})
export class ChainRewardDetailPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public blockService: BlockServiceProvider,
		public minService: MinServiceProvider,
	) {
		super(navCtrl, navParams, true, tabs);
	}
}
