import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";

/**
 * Generated class for the AccountMinerListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({ name: "account-miner-list" })
@Component({
	selector: "page-account-miner-list",
	templateUrl: "account-miner-list.html",
})
export class AccountMinerListPage {
	constructor(public navCtrl: NavController, public navParams: NavParams) {}

	ionViewDidLoad() {
		console.log("ionViewDidLoad AccountMinerListPage");
	}
}
