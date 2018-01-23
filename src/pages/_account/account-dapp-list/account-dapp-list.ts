import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";

/**
 * Generated class for the AccountDappListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({ name: "account-dapp-list" })
@Component({
	selector: "page-account-dapp-list",
	templateUrl: "account-dapp-list.html",
})
export class AccountDappListPage {
	constructor(public navCtrl: NavController, public navParams: NavParams) {}

	ionViewDidLoad() {
		console.log("ionViewDidLoad AccountDappListPage");
	}
}
