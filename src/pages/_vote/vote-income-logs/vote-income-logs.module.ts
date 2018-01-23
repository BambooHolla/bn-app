import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { VoteIncomeLogsPage } from './vote-income-logs';

@NgModule({
  declarations: [
    VoteIncomeLogsPage,
  ],
  imports: [
    IonicPageModule.forChild(VoteIncomeLogsPage),
  ],
})
export class VoteIncomeLogsPageModule {}
