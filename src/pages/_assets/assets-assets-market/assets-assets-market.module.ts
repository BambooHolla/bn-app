import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AssetsAssetsMarketPage } from "./assets-assets-market";
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
	declarations: [AssetsAssetsMarketPage],
	imports: [
		IonicPageModule.forChild(AssetsAssetsMarketPage),
		TranslateModule,
		DirectivesModule,
		PipesModule,
		ComponentsModule,
		MatGridListModule,
		MatButtonModule,
		MomentModule,
	],
})
export class AssetsAssetsMarketPageModule {}
