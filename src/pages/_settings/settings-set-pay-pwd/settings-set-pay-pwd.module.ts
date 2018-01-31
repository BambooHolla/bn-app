import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { SettingsSetPayPwdPage } from "./settings-set-pay-pwd";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";

@NgModule({
	declarations: [SettingsSetPayPwdPage],
	imports: [
		IonicPageModule.forChild(SettingsSetPayPwdPage),
		ComponentsModule,
		DirectivesModule,
	],
})
export class SettingsSetPayPwdPageModule {}
