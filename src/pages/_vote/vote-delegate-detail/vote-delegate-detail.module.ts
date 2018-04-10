import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { VoteDelegateDetailPage } from "./vote-delegate-detail";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { MomentModule } from "angular2-moment";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [VoteDelegateDetailPage],
  imports: [
    IonicPageModule.forChild(VoteDelegateDetailPage),
    ComponentsModule,
    DirectivesModule,
    PipesModule,
    MomentModule,
    TranslateModule,
  ],
})
export class VoteDelegateDetailPageModule {}
