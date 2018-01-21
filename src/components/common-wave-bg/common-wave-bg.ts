import { Component, Input } from "@angular/core";

/**
 * Generated class for the CommonWaveBgComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
	selector: "common-wave-bg",
	templateUrl: "common-wave-bg.html",
})
export class CommonWaveBgComponent {
	@Input("show") show = true;
}
