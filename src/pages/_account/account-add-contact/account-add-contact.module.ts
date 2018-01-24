import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountAddContactPage } from "./account-add-contact";
import { ComponentsModule } from "../../../components/components.module";

@NgModule({
	declarations: [AccountAddContactPage],
	imports: [
		IonicPageModule.forChild(AccountAddContactPage),
		ComponentsModule,
	],
})
export class AccountAddContactPageModule {}
