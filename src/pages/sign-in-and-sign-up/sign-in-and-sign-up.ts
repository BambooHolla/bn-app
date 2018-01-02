import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";

/**
 * Generated class for the SignInAndSignUpPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({ name: "SignInAndSignUpPage" })
@Component({
	selector: "page-sign-in-and-sign-up",
	templateUrl: "sign-in-and-sign-up.html",
})
export class SignInAndSignUpPage {
	constructor(public navCtrl: NavController, public navParams: NavParams) {}

	ionViewDidLoad() {
		console.log("ionViewDidLoad SignInAndSignUpPage");
	}
}
