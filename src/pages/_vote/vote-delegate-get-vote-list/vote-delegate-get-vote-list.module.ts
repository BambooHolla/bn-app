import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { VoteDelegateGetVoteListPage } from "./vote-delegate-get-vote-list";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material";

@NgModule({
	declarations: [VoteDelegateGetVoteListPage],
	imports: [IonicPageModule.forChild(VoteDelegateGetVoteListPage), ComponentsModule, DirectivesModule, PipesModule, TranslateModule, MatButtonModule],
})
export class VoteDelegateGetVoteListPageModule {}
