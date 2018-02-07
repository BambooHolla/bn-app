import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountMyTransactionListPage } from "./account-my-transaction-list";
import { MomentModule } from "angular2-moment";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
	declarations: [AccountMyTransactionListPage],
	imports: [
		IonicPageModule.forChild(AccountMyTransactionListPage),
		MomentModule,
		ComponentsModule,
		DirectivesModule,
		PipesModule,
		TranslateModule,
	],
})
export class AccountMyTransactionListPageModule {}
