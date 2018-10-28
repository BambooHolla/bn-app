import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';

@Component({
  templateUrl: 'popover.html'
})
export class PopoverComponent {
    constructor(public viewCtrl: ViewController) {}

    close() {
      this.viewCtrl.dismiss();
    }
  }
