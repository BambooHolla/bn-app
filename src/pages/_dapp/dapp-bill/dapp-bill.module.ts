import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DappBillPage } from './dapp-bill';

@NgModule({
  declarations: [
    DappBillPage,
  ],
  imports: [
    IonicPageModule.forChild(DappBillPage),
  ],
})
export class DappBillPageModule {}
