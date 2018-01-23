import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";

/**
 * Generated class for the ChainBlockDetailPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({ name: "chain-block-detail" })
@Component({
	selector: "page-chain-block-detail",
	templateUrl: "chain-block-detail.html",
})
export class ChainBlockDetailPage {
	constructor(public navCtrl: NavController, public navParams: NavParams) {}

	ionViewDidLoad() {
		console.log("ionViewDidLoad ChainBlockDetailPage");
	}
}
