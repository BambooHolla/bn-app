import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { SettingsNetVersionPage } from "./settings-net-version";
import { ComponentsModule } from "../../../components/components.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [SettingsNetVersionPage],
  imports: [
    IonicPageModule.forChild(SettingsNetVersionPage),
    ComponentsModule,
    TranslateModule,
  ],
})
export class SettingsNetVersionPageModule {}
