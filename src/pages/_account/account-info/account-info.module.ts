import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountInfoPage } from "./account-info";
import { ComponentsModule } from "../../../components/components.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
	declarations: [AccountInfoPage],
	imports: [
		IonicPageModule.forChild(AccountInfoPage),
		ComponentsModule,
		TranslateModule,
	],
})
export class AccountInfoPageModule {}
