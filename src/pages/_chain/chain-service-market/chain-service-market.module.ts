import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { ChainServiceMarketPage } from "./chain-service-market";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import { MomentModule } from "angular2-moment";

@NgModule({
  declarations: [ChainServiceMarketPage],
  imports: [
    IonicPageModule.forChild(ChainServiceMarketPage),
    TranslateModule,
    DirectivesModule,
    PipesModule,
    ComponentsModule,
    MomentModule,
  ],
})
export class ChainServiceMarketPageModule {}
