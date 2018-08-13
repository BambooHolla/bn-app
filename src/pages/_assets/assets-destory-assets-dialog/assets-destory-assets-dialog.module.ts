import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AssetsDestoryAssetsDialogPage } from "./assets-destory-assets-dialog";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import {
	MatFormFieldModule,
	MatInputModule,
	MatAutocompleteModule,
	MatMenuModule,
	MatButtonModule,
} from "@angular/material";

@NgModule({
	declarations: [AssetsDestoryAssetsDialogPage],
	imports: [
		IonicPageModule.forChild(AssetsDestoryAssetsDialogPage),
		TranslateModule,
		DirectivesModule,
		PipesModule,
		ComponentsModule,
		MatFormFieldModule,
		MatInputModule,
		MatAutocompleteModule,
		MatMenuModule,
		MatButtonModule,
	],
})
export class AssetsDestoryAssetsDialogPageModule {}
