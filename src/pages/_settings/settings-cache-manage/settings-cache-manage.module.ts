import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { SettingsCacheManagePage } from "./settings-cache-manage";
import { TranslateModule } from "@ngx-translate/core";
import { PipesModule } from "../../../pipes/pipes.module";
import { ComponentsModule } from "../../../components/components.module";

@NgModule({
	declarations: [SettingsCacheManagePage],
	imports: [
		IonicPageModule.forChild(SettingsCacheManagePage),
		TranslateModule,
		PipesModule,
		ComponentsModule,
	],
})
export class SettingsCacheManagePageModule {}
