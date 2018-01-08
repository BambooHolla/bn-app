import { Component, Input } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
	selector: "gold-coin",
	templateUrl: "gold-coin.html",
})
export class GoldCoinComponent {
	@Input("ani-count")
	set count(v) {
		this.style.animationIterationCount = v;
	}
	get count() {
		return this.style.animationIterationCount;
	}
	@Input("ani-speed")
	set speed(v) {
		this.style.animationTimingFunction = this.sanitizer.bypassSecurityTrustStyle(
			`steps(${v * 36})`,
		);
		this.style.animationDuration = 1 / v + "s";
		this._speed = v;
	}
	get speed() {
		return this._speed;
	}
	_speed = 1;
	style = {
		animationIterationCount: "infinite",
		animationDuration: "1s",
		animationTimingFunction: this.sanitizer.bypassSecurityTrustStyle(
			"steps(36)",
		),
	};
	constructor(public sanitizer: DomSanitizer) {}
}
