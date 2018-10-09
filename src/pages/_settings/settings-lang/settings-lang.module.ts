import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { SettingsLangPage } from "./settings-lang";
import { ComponentsModule } from "../../../components/components.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [SettingsLangPage],
  imports: [
    IonicPageModule.forChild(SettingsLangPage),
    ComponentsModule,
    TranslateModule,
  ],
})
export class SettingsLangPageModule {}
