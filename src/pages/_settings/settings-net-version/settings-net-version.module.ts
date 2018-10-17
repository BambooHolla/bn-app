import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { SettingsNetVersionPage } from "./settings-net-version";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
	declarations: [SettingsNetVersionPage],
	imports: [IonicPageModule.forChild(SettingsNetVersionPage), ComponentsModule, DirectivesModule, TranslateModule],
})
export class SettingsNetVersionPageModule {}
