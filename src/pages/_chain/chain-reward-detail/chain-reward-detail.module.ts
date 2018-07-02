import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ChainRewardDetailPage } from './chain-reward-detail';

@NgModule({
  declarations: [
    ChainRewardDetailPage,
  ],
  imports: [
    IonicPageModule.forChild(ChainRewardDetailPage),
  ],
})
export class ChainRewardDetailPageModule {}
