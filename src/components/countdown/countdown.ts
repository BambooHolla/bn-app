import {
	Component,
	Input,
	ChangeDetectorRef,
	ChangeDetectionStrategy,
} from "@angular/core";
import { AniBase } from "../AniBase";

@Component({
	selector: "countdown",
	templateUrl: "countdown.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountdownComponent {
	@Input("end-data")
	set end_data(v) {
		this._end_data = v;
	}
	get end_data() {
		return this._end_data;
	}
	_end_data?: Date;
	constructor(public cdRef: ChangeDetectorRef) {}

	hour = "00";
	minute = "00";
	second = "00";
	update() {
		const cur_data = new Date();
		const { end_data } = this;
		if (!end_data || end_data.valueOf() <= cur_data.valueOf()) {
			this.hour = "00";
			this.minute = "00";
			this.second = "00";
			return false;
		}
		let hour = end_data.getHours() - cur_data.getHours();
		let minute = end_data.getMinutes() - cur_data.getMinutes();
		let second = end_data.getSeconds() - cur_data.getSeconds();
		if (second < 0) {
			second += 60;
			minute -= 1;
		}
		if (minute < 0) {
			minute += 60;
			hour -= 1;
		}
		this.hour = ("0" + hour).substr(-2);
		this.minute = ("0" + minute).substr(-2);
		this.second = ("0" + second).substr(-2);
		this.cdRef.markForCheck();
		return true;
	}
	private _ti;
	startAnimation() {
		if (!this.update()) {
			return;
		}
		let res_ms =
			(this.end_data as Date).getMilliseconds() - Date.now() % 1000;
		if (res_ms < 0) {
			res_ms += 1000;
		}
		this._ti = setTimeout(() => {
			this.startAnimation();
		}, res_ms);
	}
	stopAnimation() {
		if (this._ti) {
			clearInterval(this._ti);
			this._ti = null;
		}
	}
}
