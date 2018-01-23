import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";

/**
 * Generated class for the VoteDelegateDetailPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({ name: "vote-delegate-detail" })
@Component({
	selector: "page-vote-delegate-detail",
	templateUrl: "vote-delegate-detail.html",
})
export class VoteDelegateDetailPage {
	constructor(public navCtrl: NavController, public navParams: NavParams) {}

	ionViewDidLoad() {
		console.log("ionViewDidLoad VoteDelegateDetailPage");
	}
}
