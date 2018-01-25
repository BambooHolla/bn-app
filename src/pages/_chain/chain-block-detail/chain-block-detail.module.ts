import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { ChainBlockDetailPage } from "./chain-block-detail";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { MomentModule } from "angular2-moment";

@NgModule({
	declarations: [ChainBlockDetailPage],
	imports: [
		IonicPageModule.forChild(ChainBlockDetailPage),
		ComponentsModule,
		DirectivesModule,
		MomentModule,
	],
})
export class ChainBlockDetailPageModule {}
