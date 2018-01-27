import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { SettingsLangPage } from "./settings-lang";
import { ComponentsModule } from "../../../components/components.module";

@NgModule({
  declarations: [SettingsLangPage],
  imports: [IonicPageModule.forChild(SettingsLangPage), ComponentsModule],
})
export class SettingsLangPageModule {}
