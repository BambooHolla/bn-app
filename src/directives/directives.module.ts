import { NgModule } from "@angular/core";
import { IonContentScrollShadowDirective } from "./ion-content-scroll-shadow/ion-content-scroll-shadow";
import { SetInputStatusDirective } from "./set-input-status/set-input-status";
@NgModule({
	declarations: [IonContentScrollShadowDirective, SetInputStatusDirective],
	imports: [],
	exports: [IonContentScrollShadowDirective, SetInputStatusDirective],
})
export class DirectivesModule {}
