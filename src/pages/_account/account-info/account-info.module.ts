import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { AccountInfoPage } from "./account-info";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material";

@NgModule({
	declarations: [AccountInfoPage],
	imports: [IonicPageModule.forChild(AccountInfoPage), ComponentsModule, DirectivesModule, TranslateModule, MatButtonModule],
})
export class AccountInfoPageModule {}
