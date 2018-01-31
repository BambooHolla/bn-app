import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountSetUsernamePage } from "./account-set-username";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";

@NgModule({
	declarations: [AccountSetUsernamePage],
	imports: [
		IonicPageModule.forChild(AccountSetUsernamePage),
		ComponentsModule,
		DirectivesModule,
	],
})
export class AccountSetUsernamePageModule {}
