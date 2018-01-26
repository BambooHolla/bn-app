import { ViewChild, ElementRef, Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
// import * as Instascan from "instascan";
// window["Instascan"] = Instascan;

/**
 * Generated class for the AccountScanAddContactPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({ name: "account-scan-add-contact" })
@Component({
	selector: "page-account-scan-add-contact",
	templateUrl: "account-scan-add-contact.html",
})
export class AccountScanAddContactPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
	) {
		super(navCtrl, navParams, true, tabs);
		// window["Instascan"] = Instascan;
		// alert(Instascan);
	}
	innerHeight = window.innerHeight;
	innerWidth = window.innerWidth;
	@ViewChild("video") video: ElementRef;
	@AccountScanAddContactPage.willEnter
	@asyncCtrlGenerator.error("扫描异常")
	openCameraMedia() {
		// const scanner = new Instascan.Scanner({
		// 	video: this.video.nativeElement,
		// 	mirror: false,
		// 	captureImage: true,
		// });
		// return Instascan.Camera.getCameras().then(function(cameras) {
		// 	if (cameras.length > 0) {
		// 		console.log(cameras);
		// 		return scanner.start(cameras[0]);
		// 	} else {
		// 		console.error("No cameras found.");
		// 	}
		// });
		/**/
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			const video = this.video.nativeElement;
			// Not adding `{ audio: true }` since we only want video now
			navigator.mediaDevices
				.getUserMedia({
					video: {
						width: this.innerWidth,
						height: this.innerHeight,
						facingMode: "environment",
					},
					audio: false,
				})
				.then(function(stream) {
					video.src = window.URL.createObjectURL(stream);
					video.play();
				})
				.catch(err => {
					console.log("qaq", err);
				});
		}
	}
}
