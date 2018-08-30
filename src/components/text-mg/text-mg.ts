import {
	Component,
	ViewChild,
	ElementRef,
	ChangeDetectionStrategy,
	Input,
	OnInit,
	OnChanges,
	SimpleChanges,
	SimpleChange,
} from "@angular/core";

/**
 * Generated class for the TextMgComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
	selector: "text-mg",
	templateUrl: "text-mg.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextMgComponent implements OnInit, OnChanges {
	@Input("text") text = "";
	@Input("from") from = "transparent";
	@Input("to") to = "transparent";

	@ViewChild("wrapper") wrapper!: ElementRef;
	get wrapperEle() {
		return this.wrapper.nativeElement as HTMLSpanElement;
	}
	@ViewChild("background") background!: ElementRef;
	get backgroundEle() {
		return this.background.nativeElement as HTMLSpanElement;
	}
	@ViewChild("foreground") foreground!: ElementRef;
	get foregroundEle() {
		return this.foreground.nativeElement as HTMLSpanElement;
	}
	@Input("stops")
	set stops(v) {
		this._stops = v;
	}
	private _stops?: number[][]; /*alpha, per*/
	get stops() {
		return this._stops || [[0, 0], [1, 1]];
	}

	@Input("no-trim-blank") no_trim_blank = false;
	@Input("fontSize") fontSize = "1.6em";
	@Input("fontWeight") fontWeight = "normal";
	@Input("fontFamily")
	fontFamily = [
		"-apple-system",
		"SF Compact Display",
		"Helvetica Neue",
		"Roboto",
		"sans-serif",
	];
	@Input("direction") direction = "to right";
	@Input("fallbackColor") fallbackColor = "";

	ngOnInit() {
		this.updateText();
	}
	updateText() {
		const { wrapperEle, backgroundEle, foregroundEle } = this;
		wrapperEle.style.fontSize = this.fontSize;
		wrapperEle.style.lineHeight = this.fontSize;
		wrapperEle.style.fontFamily = this.fontFamily as any;
		wrapperEle.style.fontWeight = this.fontWeight;
		backgroundEle.style.cssText = `color:${this.from};`;
		const gradient = [
			this.stops.map(stop => `rgba(0,0,0,${stop[0]}) ${stop[1] * 100}%`),
		].join(",");
		foregroundEle.style.cssText = `
			-webkit-mask-image: linear-gradient(${this.direction}, ${gradient});
			mask-image: linear-gradient(${this.direction}, ${gradient});
			-webkit-mask-size: 100% 100%;
			mask-size: 100% 100%;
			color:${this.to};
		`;
	}
	ngOnChanges(changes: SimpleChanges) {
		this.updateText();
	}
}
