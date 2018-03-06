import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { ChainTransactionDetailPage } from "./chain-transaction-detail";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { MomentModule } from "angular2-moment";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [ChainTransactionDetailPage],
  imports: [
    IonicPageModule.forChild(ChainTransactionDetailPage),
    ComponentsModule,
    PipesModule,
    MomentModule,
    TranslateModule,
  ],
})
export class ChainTransactionDetailPageModule {}
