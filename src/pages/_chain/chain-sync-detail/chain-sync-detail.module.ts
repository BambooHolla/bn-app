import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { ChainSyncDetailPage } from "./chain-sync-detail";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
	declarations: [ChainSyncDetailPage],
	imports: [
		IonicPageModule.forChild(ChainSyncDetailPage),
		TranslateModule,
		DirectivesModule,
		ComponentsModule,
	],
})
export class ChainSyncDetailPageModule {}
