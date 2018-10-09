import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { VoteListPage } from "./vote-list";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { MomentModule } from "angular2-moment";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [VoteListPage],
  imports: [
    IonicPageModule.forChild(VoteListPage),
    ComponentsModule,
    PipesModule,
    DirectivesModule,
    MomentModule,
    TranslateModule,
  ],
})
export class VoteListPageModule {}
