import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";

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
export class AccountScanAddContactPage {
	constructor(public navCtrl: NavController, public navParams: NavParams) {}

	ionViewDidLoad() {
		console.log("ionViewDidLoad AccountScanAddContactPage");
	}
}
