import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { PayReceivePage } from "./pay-receive";
import { ComponentsModule } from "../../../components/components.module";
import { MomentModule } from "angular2-moment";

@NgModule({
	declarations: [PayReceivePage],
	imports: [
		IonicPageModule.forChild(PayReceivePage),
		ComponentsModule,
		MomentModule,
	],
})
export class PayReceivePageModule {}
