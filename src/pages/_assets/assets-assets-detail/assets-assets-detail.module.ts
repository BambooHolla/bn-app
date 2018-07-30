import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AssetsAssetsDetailPage } from "./assets-assets-detail";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import {
	MatGridListModule,
	MatButtonModule,
} from "@angular/material";
import { MomentModule } from "angular2-moment";

@NgModule({
	declarations: [AssetsAssetsDetailPage],
	imports: [
		IonicPageModule.forChild(AssetsAssetsDetailPage),
		TranslateModule,
		DirectivesModule,
		PipesModule,
		ComponentsModule,
		MatGridListModule,
		MatButtonModule,
		MomentModule,
	],
})
export class AssetsAssetsDetailPageModule {}
