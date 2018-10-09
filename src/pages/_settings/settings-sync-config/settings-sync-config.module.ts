import { NgModule } from '@angular/core';
import { IonicPageModule } from "ionic-angular/index";
import { SettingsSyncConfigPage } from './settings-sync-config';
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [
    SettingsSyncConfigPage,
  ],
  imports: [
    IonicPageModule.forChild(SettingsSyncConfigPage),
    TranslateModule,
  ],
})
export class SettingsSyncConfigPageModule {}
