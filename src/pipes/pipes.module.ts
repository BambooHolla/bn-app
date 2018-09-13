import { NgModule } from "@angular/core";
import { MaskPipe } from "./mask/mask";
import { TimestampPipe } from "./timestamp/timestamp";
import { DatediffPipe } from "./datediff/datediff";
import { AmountEulerPipe } from "./amount-euler/amount-euler";
import { BytesPipe } from "./bytes/bytes";
import { AmomentPipe } from './amoment/amoment';
import { CommonDurationHumainzePipe } from './common-duration-humainze/common-duration-humainze';
@NgModule({
  declarations: [
    MaskPipe,
    TimestampPipe,
    DatediffPipe,
    AmountEulerPipe,
    BytesPipe,
    AmomentPipe,
    CommonDurationHumainzePipe,
  ],
  imports: [],
  exports: [MaskPipe, TimestampPipe, DatediffPipe, AmountEulerPipe, BytesPipe,
    AmomentPipe,
    CommonDurationHumainzePipe],
})
export class PipesModule {}
