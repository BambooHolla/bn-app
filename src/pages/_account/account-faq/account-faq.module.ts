import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountFaqPage } from "./account-faq";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
	declarations: [AccountFaqPage],
	imports: [
		IonicPageModule.forChild(AccountFaqPage),
		TranslateModule,
		DirectivesModule,
		ComponentsModule,
	],
})
export class AccountFaqPageModule {}
