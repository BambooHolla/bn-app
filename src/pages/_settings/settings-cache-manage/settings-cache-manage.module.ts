import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SettingsCacheManagePage } from './settings-cache-manage';

@NgModule({
  declarations: [
    SettingsCacheManagePage,
  ],
  imports: [
    IonicPageModule.forChild(SettingsCacheManagePage),
  ],
})
export class SettingsCacheManagePageModule {}
