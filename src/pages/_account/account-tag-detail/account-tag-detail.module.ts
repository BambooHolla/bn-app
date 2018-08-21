import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountTagDetailPage } from "./account-tag-detail";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import {
	MatFormFieldModule,
	MatInputModule,
	MatAutocompleteModule,
	MatMenuModule,
	MatButtonModule,
	MatChipsModule,
	MatIconModule,
} from "@angular/material";

@NgModule({
	declarations: [AccountTagDetailPage],
	imports: [
		IonicPageModule.forChild(AccountTagDetailPage),
		ComponentsModule,
		PipesModule,
		TranslateModule,
		MatFormFieldModule,
		MatInputModule,
		MatAutocompleteModule,
		MatMenuModule,
		MatButtonModule,
		MatChipsModule,
		MatIconModule,
	],
})
export class AccountTagDetailPageModule {}
