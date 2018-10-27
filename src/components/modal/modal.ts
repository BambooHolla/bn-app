import { Component } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';
import { SubchainModelWithSafeUrl } from "../../providers/subchain-service/subchain-service";

@Component({
  templateUrl: 'modal.html'
})
export class ModalComponent {

  subchainList: SubchainModelWithSafeUrl[] = [];
  constructor(
    public viewCtrl: ViewController,
    public navParams: NavParams
  ) {
    this.subchainList = this.navParams.get('subchainList');
  }

  dismiss() {
    this.subchainList = [];
    this.viewCtrl.dismiss();
  }

}
