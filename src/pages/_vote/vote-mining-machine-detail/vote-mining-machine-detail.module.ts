import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { VoteMiningMachineDetailPage } from "./vote-mining-machine-detail";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { MomentModule } from "angular2-moment";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [VoteMiningMachineDetailPage],
  imports: [
    IonicPageModule.forChild(VoteMiningMachineDetailPage),
    ComponentsModule,
    PipesModule,
    DirectivesModule,
    MomentModule,
    TranslateModule,
  ],
})
export class VoteMiningMachineDetailPageModule {}
