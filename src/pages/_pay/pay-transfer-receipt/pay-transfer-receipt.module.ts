import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { PayTransferReceiptPage } from "./pay-transfer-receipt";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { MomentModule } from "angular2-moment";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material";

@NgModule({
  declarations: [PayTransferReceiptPage],
  imports: [
    IonicPageModule.forChild(PayTransferReceiptPage),
    ComponentsModule,
    DirectivesModule,
    PipesModule,
    MomentModule,
    TranslateModule,
    MatButtonModule,
  ],
})
export class PayTransferReceiptPageModule {}
