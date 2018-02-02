import { NgModule } from "@angular/core";
import { IonContentScrollShadowDirective } from "./ion-content-scroll-shadow/ion-content-scroll-shadow";
import { SetInputStatusDirective } from "./set-input-status/set-input-status";
import { InputContainerDirective } from './input-container/input-container';
@NgModule({
	declarations: [IonContentScrollShadowDirective, SetInputStatusDirective,
    InputContainerDirective],
	imports: [],
	exports: [IonContentScrollShadowDirective, SetInputStatusDirective,
    InputContainerDirective],
})
export class DirectivesModule {}
