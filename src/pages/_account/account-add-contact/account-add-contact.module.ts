import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AccountAddContactPage } from './account-add-contact';

@NgModule({
  declarations: [
    AccountAddContactPage,
  ],
  imports: [
    IonicPageModule.forChild(AccountAddContactPage),
  ],
})
export class AccountAddContactPageModule {}
