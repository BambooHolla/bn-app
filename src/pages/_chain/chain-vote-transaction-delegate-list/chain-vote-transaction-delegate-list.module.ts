import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { ChainVoteTransactionDelegateListPage } from "./chain-vote-transaction-delegate-list";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { MomentModule } from "angular2-moment";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material";

@NgModule({
	declarations: [ChainVoteTransactionDelegateListPage],
	imports: [
		IonicPageModule.forChild(ChainVoteTransactionDelegateListPage),
		ComponentsModule,
		DirectivesModule,
		PipesModule,
		MomentModule,
		TranslateModule,
		MatButtonModule,
	],
})
export class ChainVoteTransactionDelegateListPageModule {}
