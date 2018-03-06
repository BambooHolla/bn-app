import { NgModule } from "@angular/core";
import { MaskPipe } from "./mask/mask";
import { TimestampPipe } from "./timestamp/timestamp";
import { DatediffPipe } from "./datediff/datediff";
import { AmountEulerPipe } from "./amount-euler/amount-euler";
import { BytesPipe } from "./bytes/bytes";
@NgModule({
  declarations: [
    MaskPipe,
    TimestampPipe,
    DatediffPipe,
    AmountEulerPipe,
    BytesPipe,
  ],
  imports: [],
  exports: [MaskPipe, TimestampPipe, DatediffPipe, AmountEulerPipe, BytesPipe],
})
export class PipesModule {}
