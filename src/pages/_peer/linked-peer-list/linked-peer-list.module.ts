import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LinkedPeerListPage } from './linked-peer-list';

@NgModule({
  declarations: [
    LinkedPeerListPage,
  ],
  imports: [
    IonicPageModule.forChild(LinkedPeerListPage),
  ],
})
export class LinkedPeerListPageModule {}
