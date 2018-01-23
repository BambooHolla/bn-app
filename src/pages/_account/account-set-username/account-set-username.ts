import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";

/**
 * Generated class for the AccountSetUsernamePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({ name: "account-set-username" })
@Component({
	selector: "page-account-set-username",
	templateUrl: "account-set-username.html",
})
export class AccountSetUsernamePage {
	constructor(public navCtrl: NavController, public navParams: NavParams) {}

	ionViewDidLoad() {
		console.log("ionViewDidLoad AccountSetUsernamePage");
	}
}
