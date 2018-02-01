import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountMyContactsPage } from "./account-my-contacts";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
	declarations: [AccountMyContactsPage],
	imports: [
		IonicPageModule.forChild(AccountMyContactsPage),
		ComponentsModule,
		PipesModule,
		TranslateModule,
	],
})
export class AccountMyContactsPageModule {}
