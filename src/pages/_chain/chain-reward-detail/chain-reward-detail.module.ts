import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { ChainRewardDetailPage } from "./chain-reward-detail";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [ChainRewardDetailPage],
  imports: [
    IonicPageModule.forChild(ChainRewardDetailPage),
    TranslateModule,
    DirectivesModule,
    ComponentsModule,
  ],
})
export class ChainRewardDetailPageModule {}
