import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountMyLocalContactsPage } from "./account-my-local-contacts";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material";

@NgModule({
	declarations: [AccountMyLocalContactsPage],
	imports: [
		IonicPageModule.forChild(AccountMyLocalContactsPage),
		ComponentsModule,
		PipesModule,
		TranslateModule,
		MatButtonModule,
	],
})
export class AccountMyLocalContactsPageModule {}
