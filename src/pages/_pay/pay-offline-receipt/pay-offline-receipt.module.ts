import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { PayOfflineReceiptPage } from "./pay-offline-receipt";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { MomentModule } from "angular2-moment";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
	declarations: [PayOfflineReceiptPage],
	imports: [
		IonicPageModule.forChild(PayOfflineReceiptPage),
		ComponentsModule,
		DirectivesModule,
		PipesModule,
		MomentModule,
		TranslateModule,
	],
})
export class PayOfflineReceiptPageModule {}
