import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";

/**
 * Generated class for the PayReceivePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({ name: "pay-receive" })
@Component({
	selector: "page-pay-receive",
	templateUrl: "pay-receive.html",
})
export class PayReceivePage {
	constructor(public navCtrl: NavController, public navParams: NavParams) {}

	ionViewDidLoad() {
		console.log("ionViewDidLoad PayReceivePage");
	}
}
