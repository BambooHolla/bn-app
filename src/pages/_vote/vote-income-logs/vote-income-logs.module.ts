import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { VoteIncomeLogsPage } from "./vote-income-logs";
import { ComponentsModule } from "../../../components/components.module";
import { MomentModule } from "angular2-moment";

@NgModule({
  declarations: [VoteIncomeLogsPage],
  imports: [
    IonicPageModule.forChild(VoteIncomeLogsPage),
    ComponentsModule,
    MomentModule,
  ],
})
export class VoteIncomeLogsPageModule {}
