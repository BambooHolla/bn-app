import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SubchainWorldPage } from './subchain-world';

@NgModule({
  declarations: [
    SubchainWorldPage,
  ],
  imports: [
    IonicPageModule.forChild(SubchainWorldPage),
  ],
})
export class SubchainWorldPageModule {}
