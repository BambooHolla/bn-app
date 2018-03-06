import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { SettingsCacheManagePage } from "./settings-cache-manage";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [SettingsCacheManagePage],
  imports: [IonicPageModule.forChild(SettingsCacheManagePage), TranslateModule],
})
export class SettingsCacheManagePageModule {}
