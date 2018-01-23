import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AccountSetUsernamePage } from './account-set-username';

@NgModule({
  declarations: [
    AccountSetUsernamePage,
  ],
  imports: [
    IonicPageModule.forChild(AccountSetUsernamePage),
  ],
})
export class AccountSetUsernamePageModule {}
