import { Component, Input, ChangeDetectionStrategy } from "@angular/core";

/**
 * Generated class for the CommonWaveBgComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: "common-wave-bg",
  templateUrl: "common-wave-bg.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonWaveBgComponent {
  @Input("show") show = true;
  @Input("wave1-color") color1 = "#FFF";
  @Input("wave1-opacity") opacity1 = 1;
  @Input("wave2-color") color2 = "#fc874b";
  @Input("wave2-opacity") opacity2 = 0.8;
  @Input("wave3-color") color3 = "#fc6739";
  @Input("wave3-opacity") opacity3 = 0.6;
}
