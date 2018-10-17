import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { AccountMyLocalContactsPage } from "./account-my-local-contacts";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material";
import { DirectivesModule } from "../../../directives/directives.module";

@NgModule({
	declarations: [AccountMyLocalContactsPage],
	imports: [
		IonicPageModule.forChild(AccountMyLocalContactsPage),
		ComponentsModule,
		PipesModule,
		TranslateModule,
		MatButtonModule,
		DirectivesModule,
	],
})
export class AccountMyLocalContactsPageModule {}
