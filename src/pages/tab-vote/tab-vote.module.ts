import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { TabVotePage } from "./tab-vote";
import { ComponentsModule } from "../../components/components.module";
import { VoteCurrentBlockIncomeComponent } from "../../components/vote-current-block-income/vote-current-block-income";
import { VoteIncomeTrendComponent } from "../../components/vote-income-trend/vote-income-trend";
import { VoteMyContributionComponent } from "../../components/vote-my-contribution/vote-my-contribution";
import { VotePreRoundIncomeRateComponent } from "../../components/vote-pre-round-income-rate/vote-pre-round-income-rate";
import { VotePreRoundIncomeRankingComponent } from "../../components/vote-pre-round-income-ranking/vote-pre-round-income-ranking";
import { DirectivesModule } from "../../directives/directives.module";
import { PipesModule } from "../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
	declarations: [
		TabVotePage,
		VoteCurrentBlockIncomeComponent,
		VoteIncomeTrendComponent,
		VoteMyContributionComponent,
		VotePreRoundIncomeRateComponent,
		VotePreRoundIncomeRankingComponent,
	],
	imports: [
		IonicPageModule.forChild(TabVotePage),
		ComponentsModule,
		PipesModule,
		DirectivesModule,
		TranslateModule,
	],
})
export class TabVotePageModule {}
