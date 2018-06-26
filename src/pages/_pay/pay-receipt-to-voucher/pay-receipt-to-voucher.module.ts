import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { PayReceiptToVoucherPage } from "./pay-receipt-to-voucher";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { MomentModule } from "angular2-moment";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [PayReceiptToVoucherPage],
  imports: [
    IonicPageModule.forChild(PayReceiptToVoucherPage),
    ComponentsModule,
    DirectivesModule,
    PipesModule,
    MomentModule,
    TranslateModule,
  ],
})
export class PayReceiptToVoucherPageModule {}
