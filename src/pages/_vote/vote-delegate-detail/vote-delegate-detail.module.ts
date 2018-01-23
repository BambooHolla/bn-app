import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { VoteDelegateDetailPage } from './vote-delegate-detail';

@NgModule({
  declarations: [
    VoteDelegateDetailPage,
  ],
  imports: [
    IonicPageModule.forChild(VoteDelegateDetailPage),
  ],
})
export class VoteDelegateDetailPageModule {}
