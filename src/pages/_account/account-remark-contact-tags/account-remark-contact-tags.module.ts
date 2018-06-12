import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountRemarkContactTagsPage } from "./account-remark-contact-tags";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
	declarations: [AccountRemarkContactTagsPage],
	imports: [
		IonicPageModule.forChild(AccountRemarkContactTagsPage),
		ComponentsModule,
		PipesModule,
		TranslateModule,
	],
})
export class AccountRemarkContactTagsPageModule {}
