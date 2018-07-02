import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ChainSyncDetailPage } from './chain-sync-detail';

@NgModule({
  declarations: [
    ChainSyncDetailPage,
  ],
  imports: [
    IonicPageModule.forChild(ChainSyncDetailPage),
  ],
})
export class ChainSyncDetailPageModule {}
