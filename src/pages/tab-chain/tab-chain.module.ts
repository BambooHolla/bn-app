import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TabChainPage } from './tab-chain';

@NgModule({
  declarations: [
    TabChainPage,
  ],
  imports: [
    IonicPageModule.forChild(TabChainPage),
  ],
})
export class TabChainPageModule {}
