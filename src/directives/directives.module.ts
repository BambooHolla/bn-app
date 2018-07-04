import { NgModule } from "@angular/core";
import { KeyboardAttachDirective } from "./keyboard-attach/keyboard-attach";
import { IonContentScrollShadowDirective } from "./ion-content-scroll-shadow/ion-content-scroll-shadow";
import { SetInputStatusDirective } from "./set-input-status/set-input-status";
import { InputContainerDirective } from "./input-container/input-container";
import { ScrollParentIonContentFirstDirective } from "./scroll-parent-ion-content-first/scroll-parent-ion-content-first";
import { ListAniDirective } from "./list-ani/list-ani";
import { ClickToCopyDirective } from "./click-to-copy/click-to-copy";
import { TapWaitforDirective } from "./tap-waitfor/tap-waitfor";
import { BeforeSubmitDirective } from "./before-submit/before-submit";
@NgModule({
  declarations: [
    KeyboardAttachDirective,
    IonContentScrollShadowDirective,
    SetInputStatusDirective,
    InputContainerDirective,
    ScrollParentIonContentFirstDirective,
    ListAniDirective,
    ClickToCopyDirective,
    TapWaitforDirective,
    BeforeSubmitDirective,
  ],
  imports: [],
  exports: [
    KeyboardAttachDirective,
    IonContentScrollShadowDirective,
    SetInputStatusDirective,
    InputContainerDirective,
    ScrollParentIonContentFirstDirective,
    ListAniDirective,
    ClickToCopyDirective,
    TapWaitforDirective,
    BeforeSubmitDirective,
  ],
})
export class DirectivesModule {}
