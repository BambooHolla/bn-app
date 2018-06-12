import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountRemarkContactPage } from "./account-remark-contact";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
	declarations: [AccountRemarkContactPage],
	imports: [
		IonicPageModule.forChild(AccountRemarkContactPage),
		ComponentsModule,
		PipesModule,
		TranslateModule,
	],
})
export class AccountRemarkContactPageModule {}
