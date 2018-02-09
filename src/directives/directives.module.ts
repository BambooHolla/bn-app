import { NgModule } from "@angular/core";
import { IonContentScrollShadowDirective } from "./ion-content-scroll-shadow/ion-content-scroll-shadow";
import { SetInputStatusDirective } from "./set-input-status/set-input-status";
import { InputContainerDirective } from "./input-container/input-container";
import { ScrollParentIonContentFirstDirective } from "./scroll-parent-ion-content-first/scroll-parent-ion-content-first";
import { ListAniDirective } from './list-ani/list-ani';
import { ClickToCopyDirective } from './click-to-copy/click-to-copy';
@NgModule({
	declarations: [
		IonContentScrollShadowDirective,
		SetInputStatusDirective,
		InputContainerDirective,
		ScrollParentIonContentFirstDirective,
    ListAniDirective,
    ClickToCopyDirective,
	],
	imports: [],
	exports: [
		IonContentScrollShadowDirective,
		SetInputStatusDirective,
		InputContainerDirective,
		ScrollParentIonContentFirstDirective,
    ListAniDirective,
    ClickToCopyDirective,
	],
})
export class DirectivesModule {}
