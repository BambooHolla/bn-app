import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { SettingsLangPage } from "./settings-lang";
import { ComponentsModule } from "../../../components/components.module";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material";

@NgModule({
	declarations: [SettingsLangPage],
	imports: [IonicPageModule.forChild(SettingsLangPage), ComponentsModule, TranslateModule, MatButtonModule],
})
export class SettingsLangPageModule {}
