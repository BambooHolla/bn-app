import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { ChainTransactionDetailPage } from "./chain-transaction-detail";
import { ComponentsModule } from "../../../components/components.module";
import { MomentModule } from "angular2-moment";

@NgModule({
	declarations: [ChainTransactionDetailPage],
	imports: [
		IonicPageModule.forChild(ChainTransactionDetailPage),
		ComponentsModule,
		MomentModule,
	],
})
export class ChainTransactionDetailPageModule {}
