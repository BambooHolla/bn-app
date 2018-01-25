import { Directive, Input, OnInit, OnDestroy, Renderer2 } from "@angular/core";
import { Content } from "ionic-angular";
import { Subscription } from "rxjs/Subscription";

@Directive({
	selector: "[ion-content-scroll-shadow]", // Attribute selector
})
export class IonContentScrollShadowDirective implements OnInit, OnDestroy {
	constructor(private _r2: Renderer2) {}

	@Input("ion-content-scroll-shadow") content: Content;
	default_content_shadow_config = {
		distance: 300, // 显示完整阴影所需的位移量
		from_color: [29, 98, 113, 0],
		to_color: [29, 98, 113, 0.3],
		pre_scroll_process: 0,
		is_inited: false,
		shadow_style: `inset 0 0.4rem 1rem -0.1rem`,
	};
	@Input("content-shadow-config")
	set content_shadow_config(v) {
		this._content_shadow_config = Object.assign(
			this.default_content_shadow_config,
			this._content_shadow_config,
			v,
		);
	}
	private _content_shadow_config = { ...this.default_content_shadow_config };
	get content_shadow_config() {
		return this._content_shadow_config;
	}
	// @Input("content-scroll-shadow-distance")distance
	// @Input("content-scroll-shadow-from-color")from_color
	// @Input("content-scroll-shadow-to-color")to_color
	// @Input("content-scroll-shadow-pre-scroll-process")pre_scroll_process
	// @Input("content-scroll-shadow-is-inited")is_inited
	// @Input("content-scroll-shadow-shadow-style")shadow_style

	private _sub: Subscription;
	ngOnInit() {
		console.log("contentcontentcontent", this.content);
		if (this.content_shadow_config.is_inited) {
			return;
		}
		this.content_shadow_config.is_inited = true;
		const shadow_box_ele = this._r2.createElement("div");
		this._r2.setStyle(shadow_box_ele, "position", "absolute");
		this._r2.setStyle(shadow_box_ele, "width", "100%");
		this._r2.setStyle(shadow_box_ele, "height", "100%");
		this._r2.setStyle(shadow_box_ele, "top", "0");
		this._r2.setStyle(shadow_box_ele, "left", "0");
		this._r2.setStyle(shadow_box_ele, "z-index", "1000000");
		this._r2.setStyle(shadow_box_ele, "pointer-events", "none");

		this._r2.appendChild(this.content.getElementRef().nativeElement, shadow_box_ele);

		this._sub = this.content.ionScroll.subscribe(() => {
			const {
				from_color,
				to_color,
				distance,
				pre_scroll_process,
				shadow_style,
			} = this.content_shadow_config;
			const process = Math.min(this.content.scrollTop / distance, 1);
			if (process === pre_scroll_process) {
				return;
			}
			this.content_shadow_config.pre_scroll_process = process;

			let cur_color;
			if (process === 0) {
				cur_color = from_color;
			} else if (process === 1) {
				cur_color = to_color;
			} else {
				cur_color = from_color.map((from_v, i) => {
					const to_v = to_color[i];
					const res = (to_v - from_v) * process + from_v;
					return i === 3 ? res : res | 0;
				});
			}
			this._r2.setStyle(
				shadow_box_ele,
				"box-shadow",
				`${shadow_style} rgba(${cur_color})`,
			);

			// this.content.setElementStyle(
			// 	"box-shadow",
			// 	`${shadow_style} rgba(${cur_color})`,
			// );
		});
	}
	ngOnDestroy() {
		this._sub && this._sub.unsubscribe();
	}
}
