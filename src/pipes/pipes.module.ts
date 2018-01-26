import { NgModule } from '@angular/core';
import { MaskPipe } from './mask/mask';
import { TimestampPipe } from './timestamp/timestamp';
import { DatediffPipe } from './datediff/datediff';
@NgModule({
	declarations: [MaskPipe,
    TimestampPipe,
    DatediffPipe],
	imports: [],
	exports: [MaskPipe,
    TimestampPipe,
    DatediffPipe]
})
export class PipesModule {}
