import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PayReceivePage } from './pay-receive';

@NgModule({
  declarations: [
    PayReceivePage,
  ],
  imports: [
    IonicPageModule.forChild(PayReceivePage),
  ],
})
export class PayReceivePageModule {}
