import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DappDetailPage } from './dapp-detail';

@NgModule({
  declarations: [
    DappDetailPage,
  ],
  imports: [
    IonicPageModule.forChild(DappDetailPage),
  ],
})
export class DappDetailPageModule {}
