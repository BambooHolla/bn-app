import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";

/**
 * Generated class for the DappBillPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({ name: "dapp-bill" })
@Component({
	selector: "page-dapp-bill",
	templateUrl: "dapp-bill.html",
})
export class DappBillPage {
	constructor(public navCtrl: NavController, public navParams: NavParams) {}

	ionViewDidLoad() {
		console.log("ionViewDidLoad DappBillPage");
	}
}
