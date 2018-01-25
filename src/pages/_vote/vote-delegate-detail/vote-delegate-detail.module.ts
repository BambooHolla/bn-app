import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { VoteDelegateDetailPage } from "./vote-delegate-detail";
import { ComponentsModule } from "../../../components/components.module";

@NgModule({
	declarations: [VoteDelegateDetailPage],
	imports: [
		IonicPageModule.forChild(VoteDelegateDetailPage),
		ComponentsModule,
	],
})
export class VoteDelegateDetailPageModule {}
