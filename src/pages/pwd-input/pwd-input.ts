import { Component } from "@angular/core";
import {
	IonicPage,
	NavController,
	NavParams,
	ViewController,
} from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { UserInfoProvider } from "../../providers/user-info/user-info";

/**
 * Generated class for the PwdInputPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({ name: "pwd-input" })
@Component({
	selector: "page-pwd-input",
	templateUrl: "pwd-input.html",
})
export class PwdInputPage extends FirstLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		public viewCtrl: ViewController,
	) {
		super(navCtrl, navParams);
	}
	formData = {
		password: this.userInfo.password,
		have_password:!!this.userInfo.password,
		pay_pwd: "",
	};

	submitData() {
		this.viewCtrl.dismiss(this.formData);
	}
}
