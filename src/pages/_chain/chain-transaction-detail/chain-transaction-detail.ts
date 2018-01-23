import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the ChainTransactionDetailPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({name:"chain-transaction-detail"})
@Component({
  selector: 'page-chain-transaction-detail',
  templateUrl: 'chain-transaction-detail.html',
})
export class ChainTransactionDetailPage {

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ChainTransactionDetailPage');
  }

}
