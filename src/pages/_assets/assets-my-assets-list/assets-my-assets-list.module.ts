import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AssetsMyAssetsListPage } from "./assets-my-assets-list";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import {
	MatFormFieldModule,
	MatInputModule,
	MatAutocompleteModule,
	MatMenuModule,
} from "@angular/material";
import { MomentModule } from "angular2-moment";

@NgModule({
	declarations: [AssetsMyAssetsListPage],
	imports: [
		IonicPageModule.forChild(AssetsMyAssetsListPage),
		TranslateModule,
		DirectivesModule,
		PipesModule,
		ComponentsModule,
		MatFormFieldModule,
		MatInputModule,
		MatAutocompleteModule,
		MatMenuModule,
		MomentModule,
	],
})
export class AssetsMyAssetsListPageModule {}
