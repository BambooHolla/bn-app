import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { LinkedPeerListPage } from "./linked-peer-list";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import { MomentModule } from "angular2-moment";

@NgModule({
  declarations: [LinkedPeerListPage],
  imports: [
    IonicPageModule.forChild(LinkedPeerListPage),
    ComponentsModule,
    DirectivesModule,
    PipesModule,
    TranslateModule,
    MomentModule,
  ],
})
export class LinkedPeerListPageModule {}
