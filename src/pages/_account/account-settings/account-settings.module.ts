import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { AccountSettingsPage } from "./account-settings";
import { ComponentsModule } from "../../../components/components.module";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material";
@NgModule({
	declarations: [AccountSettingsPage],
	imports: [IonicPageModule.forChild(AccountSettingsPage), ComponentsModule, TranslateModule, MatButtonModule],
})
export class AccountSettingsPageModule {}
