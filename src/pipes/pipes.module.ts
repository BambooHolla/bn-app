import { NgModule } from '@angular/core';
import { MaskPipe } from './mask/mask';
import { TimestampPipe } from './timestamp/timestamp';
import { DatediffPipe } from './datediff/datediff';
import { AmountEulerPipe } from './amount-euler/amount-euler';
@NgModule({
	declarations: [MaskPipe,
    TimestampPipe,
    DatediffPipe,
    AmountEulerPipe],
	imports: [],
	exports: [MaskPipe,
    TimestampPipe,
    DatediffPipe,
    AmountEulerPipe]
})
export class PipesModule {}
