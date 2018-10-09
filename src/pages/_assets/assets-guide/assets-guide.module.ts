import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { AssetsGuidePage } from "./assets-guide";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material";
import { MomentModule } from "angular2-moment";

@NgModule({
	declarations: [AssetsGuidePage],
	imports: [
		IonicPageModule.forChild(AssetsGuidePage),
		TranslateModule,
		DirectivesModule,
		PipesModule,
		ComponentsModule,
		MatButtonModule,
		MomentModule,
	],
})
export class AssetsGuidePageModule {}
