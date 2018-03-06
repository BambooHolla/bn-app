import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { VoteIncomeLogsPage } from "./vote-income-logs";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { MomentModule } from "angular2-moment";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [VoteIncomeLogsPage],
  imports: [
    IonicPageModule.forChild(VoteIncomeLogsPage),
    ComponentsModule,
    PipesModule,
    MomentModule,
    TranslateModule,
  ],
})
export class VoteIncomeLogsPageModule {}
