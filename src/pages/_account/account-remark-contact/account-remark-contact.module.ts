import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { AccountRemarkContactPage } from "./account-remark-contact";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material";

@NgModule({
	declarations: [AccountRemarkContactPage],
	imports: [IonicPageModule.forChild(AccountRemarkContactPage), ComponentsModule, PipesModule, DirectivesModule, TranslateModule, MatButtonModule],
})
export class AccountRemarkContactPageModule {}
