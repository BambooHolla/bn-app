import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { ChainBlockDetailPage } from "./chain-block-detail";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { MomentModule } from "angular2-moment";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material";

@NgModule({
	declarations: [ChainBlockDetailPage],
	imports: [IonicPageModule.forChild(ChainBlockDetailPage), ComponentsModule, PipesModule, DirectivesModule, MomentModule, TranslateModule, MatButtonModule],
})
export class ChainBlockDetailPageModule {}
