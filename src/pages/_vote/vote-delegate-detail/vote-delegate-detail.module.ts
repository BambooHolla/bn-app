import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { VoteDelegateDetailPage } from "./vote-delegate-detail";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { MomentModule } from "angular2-moment";

@NgModule({
	declarations: [VoteDelegateDetailPage],
	imports: [
		IonicPageModule.forChild(VoteDelegateDetailPage),
		ComponentsModule,
		DirectivesModule,
		MomentModule,
	],
})
export class VoteDelegateDetailPageModule {}
