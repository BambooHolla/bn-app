import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ChainTransactionDetailPage } from './chain-transaction-detail';

@NgModule({
  declarations: [
    ChainTransactionDetailPage,
  ],
  imports: [
    IonicPageModule.forChild(ChainTransactionDetailPage),
  ],
})
export class ChainTransactionDetailPageModule {}
