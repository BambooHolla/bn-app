import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { TabVotePage } from "./tab-vote";
import { ComponentsModule } from "../../components/components.module";

@NgModule({
  declarations: [TabVotePage],
  imports: [IonicPageModule.forChild(TabVotePage), ComponentsModule],
})
export class TabVotePageModule {}
