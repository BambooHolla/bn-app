import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { SettingsSetDefaultFeePage } from "./settings-set-default-fee";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material";

@NgModule({
	declarations: [SettingsSetDefaultFeePage],
	imports: [IonicPageModule.forChild(SettingsSetDefaultFeePage), DirectivesModule, PipesModule, ComponentsModule, TranslateModule, MatButtonModule],
})
export class SettingsSetDefaultFeePageModule {}
