import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountContactDetailPage } from "./account-contact-detail";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { TranslateModule } from "@ngx-translate/core";
import { MomentModule } from "angular2-moment";

@NgModule({
	declarations: [AccountContactDetailPage],
	imports: [
		IonicPageModule.forChild(AccountContactDetailPage),
		ComponentsModule,
		PipesModule,
		DirectivesModule,
		TranslateModule,
		MomentModule,
	],
})
export class AccountContactDetailPageModule {}
