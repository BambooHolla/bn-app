import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ChainBlockDetailPage } from './chain-block-detail';

@NgModule({
  declarations: [
    ChainBlockDetailPage,
  ],
  imports: [
    IonicPageModule.forChild(ChainBlockDetailPage),
  ],
})
export class ChainBlockDetailPageModule {}
