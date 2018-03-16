import { Component, Optional, ViewChild, ElementRef } from "@angular/core";
import { DomSanitizer, SafeStyle } from "@angular/platform-browser";
import {
	IonicPage,
	NavController,
	NavParams,
	Refresher,
	Content,
	ViewController,
} from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { SocialSharing } from "@ionic-native/social-sharing";

@IonicPage({ name: "share-app-panel" })
@Component({
	selector: "page-share-app-panel",
	templateUrl: "share-app-panel.html",
})
export class ShareAppPanelPage extends FirstLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		public viewCtrl: ViewController,
		public socialSharing: SocialSharing,
	) {
		super(navCtrl, navParams);
	}
	shareItems = ["TWITTER", "FACEBOOK", "INSTAGRAM"];

	share_message!: string;
	share_link?: string;
	logo_link!: string;
	@ShareAppPanelPage.willEnter
	initData() {
		const a = document.createElement("a");
		a.href = "assets/imgs/logo.png";
		this.logo_link = a.href;
		this.share_message = this.navParams.get("message");
		this.share_link = this.navParams.get("link");
	}
	@asyncCtrlGenerator.error("@@SHARE_APP_ERROR")
	async shareVia(type: string) {
		if (type === "TWITTER") {
			return this.socialSharing.shareViaTwitter(
				this.share_message,
				this.logo_link,
				this.share_link,
			);
		} else if (type === "FACEBOOK") {
			return this.socialSharing.shareViaFacebook(
				this.share_message,
				this.logo_link,
				this.share_link,
			);
		} else if (type === "INSTAGRAM") {
			return this.socialSharing.shareViaInstagram(
				this.share_message + " " + this.share_link,
				this.logo_link,
			);
		}
	}
	closeModal() {
		return this.viewCtrl.dismiss();
	}
}
