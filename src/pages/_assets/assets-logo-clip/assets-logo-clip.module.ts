import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { AssetsLogoClipPage } from "./assets-logo-clip";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule, MatIconModule } from "@angular/material";
import { MomentModule } from "angular2-moment";
import { ColorPickerModule } from 'ngx-color-picker';

@NgModule({
	declarations: [AssetsLogoClipPage],
	imports: [
		IonicPageModule.forChild(AssetsLogoClipPage),
		TranslateModule,
		DirectivesModule,
		PipesModule,
		ComponentsModule,
		MatButtonModule,
		MatIconModule,
		MomentModule,
		ColorPickerModule
	],
})
export class AssetsLogoClipPageModule {}
