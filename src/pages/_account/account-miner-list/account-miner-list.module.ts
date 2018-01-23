import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AccountMinerListPage } from './account-miner-list';

@NgModule({
  declarations: [
    AccountMinerListPage,
  ],
  imports: [
    IonicPageModule.forChild(AccountMinerListPage),
  ],
})
export class AccountMinerListPageModule {}
