import { Component, Optional, ViewChild } from "@angular/core";
import {
	IonicPage,
	NavController,
	NavParams,
	Refresher,
	Content,
} from "ionic-angular";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import {
	TransactionServiceProvider,
	TransactionTypes,
	TransactionModel,
} from "../../../providers/transaction-service/transaction-service";
import { CommonWaveBgComponent } from "../../../components/common-wave-bg/common-wave-bg";

import { Screenshot } from "@ionic-native/screenshot";
import { SocialSharing } from "@ionic-native/social-sharing";

@IonicPage({ name: "pay-transfer-receipt" })
@Component({
	selector: "page-pay-transfer-receipt",
	templateUrl: "pay-transfer-receipt.html",
})
export class PayTransferReceiptPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		public transactionService: TransactionServiceProvider,
		@Optional() public tabs: TabsPage,
		public screenshot: Screenshot,
		public socialSharing: SocialSharing,
	) {
		super(navCtrl, navParams, true, tabs);
	}
	@ViewChild(CommonWaveBgComponent) wages!: CommonWaveBgComponent;
	/* 回执 */
	current_transfer = {
		senderUsername: "Gasubee",
		fee: "1",
		id: "bfe77120be31990bf6d398b3666bdd09657182b08678e4c2f7e2df79cdc8",
		recipientId: "e31990bf6d398b3666bdd09657",
		timestamp: 4613782,
		amount: "888888888",
	};

	is_screenshotting = false;
	capture_uri?: string;
	async share() {
		try {
			this.is_screenshotting = true;
			if (!this.capture_uri) {
				const res = await this.screenshot.URI(80);
				console.log(res);
				this.capture_uri = res.URI;
			}
			const share_res = await this.socialSharing.share(
				undefined,
				undefined,
				this.capture_uri,
			);
			console.log(share_res);
		} finally {
			this.is_screenshotting = false;
		}
	}
}
