import {
	Component,
	Input,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
} from "@angular/core";

@Component({
	selector: "simple-sector",
	templateUrl: "simple-sector.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleSectorComponent {
	private _progress = 0;
	get progress() {
		return this._progress;
	}
	@Input("progress")
	set progress(v) {
		this._progress = v;
		if (v <= 0.5) {
			this.left_deg = 0;
			this.right_deg = v * 180;
		} else {
			this.left_deg = (v - 0.5) * 360;
			this.right_deg = 180;
		}
	}
	left_deg = 0;
	right_deg = 0;
}
