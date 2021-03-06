import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { AccountMyTransactionListPage } from "./account-my-transaction-list";
import { MomentModule } from "angular2-moment";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule, MatIconModule } from "@angular/material";

@NgModule({
	declarations: [AccountMyTransactionListPage],
	imports: [
		IonicPageModule.forChild(AccountMyTransactionListPage),
		MomentModule,
		ComponentsModule,
		DirectivesModule,
		PipesModule,
		TranslateModule,
		MatButtonModule,
		MatIconModule,
	],
})
export class AccountMyTransactionListPageModule {}
