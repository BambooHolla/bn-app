import { NgModule } from "@angular/core";
import { IonContentScrollShadowDirective } from "./ion-content-scroll-shadow/ion-content-scroll-shadow";
import { SetInputStatusDirective } from "./set-input-status/set-input-status";
import { InputContainerDirective } from "./input-container/input-container";
import { ScrollParentIonContentFirstDirective } from "./scroll-parent-ion-content-first/scroll-parent-ion-content-first";
import { ListAniDirective } from './list-ani/list-ani';
@NgModule({
	declarations: [
		IonContentScrollShadowDirective,
		SetInputStatusDirective,
		InputContainerDirective,
		ScrollParentIonContentFirstDirective,
    ListAniDirective,
	],
	imports: [],
	exports: [
		IonContentScrollShadowDirective,
		SetInputStatusDirective,
		InputContainerDirective,
		ScrollParentIonContentFirstDirective,
    ListAniDirective,
	],
})
export class DirectivesModule {}
