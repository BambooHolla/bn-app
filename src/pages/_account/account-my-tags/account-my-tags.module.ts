import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { AccountMyTagsPage } from "./account-my-tags";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material";

@NgModule({
	declarations: [AccountMyTagsPage],
	imports: [
		IonicPageModule.forChild(AccountMyTagsPage),
		ComponentsModule,
		PipesModule,
		TranslateModule,
		MatButtonModule,
	],
})
export class AccountMyTagsPageModule {}
