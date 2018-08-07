import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { ChainSyncDetailPage } from "./chain-sync-detail";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import { MomentModule } from "angular2-moment";

@NgModule({
  declarations: [ChainSyncDetailPage],
  imports: [
    IonicPageModule.forChild(ChainSyncDetailPage),
    TranslateModule,
    DirectivesModule,
    PipesModule,
    ComponentsModule,
    MomentModule,
  ],
})
export class ChainSyncDetailPageModule {}
