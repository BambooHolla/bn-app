import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { PayTransferReceiptPage } from "./pay-transfer-receipt";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { MomentModule } from "angular2-moment";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [PayTransferReceiptPage],
  imports: [
    IonicPageModule.forChild(PayTransferReceiptPage),
    ComponentsModule,
    DirectivesModule,
    PipesModule,
    MomentModule,
    TranslateModule,
  ],
})
export class PayTransferReceiptPageModule {}
