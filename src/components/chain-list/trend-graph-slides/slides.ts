import * as PIXI from "pixi.js";
import { TrendSlide } from "./trend.slide";
import { AniBase, Easing } from "../../AniBase";
import { SlideStyleOpts, Slides_SlideStyle, Slides_PagStyle } from "./const";
import { SlidesFadeSlideStyle } from "./slides.fade.slide-style";
import { SlidesFadePagStyle } from "./slides.fade.pag-style";

export class Slides extends PIXI.Container {
	public view_height: number = 0;
	public slide_style: Slides_SlideStyle;
	public pag_style: Slides_PagStyle;
	constructor(
		public view_width: number,
		public slide_max_height: number,
		public pag_height: number,
		public app: PIXI.Application,
		opts?: {
			devicePixelRatio?: number;
			item_span?: number;
			slide_style?: Slides_SlideStyle;
			pag_style?: Slides_PagStyle;
		}
	) {
		super();
		this.view_height = slide_max_height + pag_height;
		if (opts) {
			if (typeof opts.devicePixelRatio === "number") {
				this.devicePixelRatio = opts.devicePixelRatio;
			}
			if (typeof opts.item_span === "number") {
				this.item_span = opts.item_span;
			}
			if (opts.slide_style) {
				this.slide_style = opts.slide_style;
			}
			if (opts.pag_style) {
				this.pag_style = opts.pag_style;
			}
		}
		this.slide_style = this["slide_style"] || new SlidesFadeSlideStyle();
		this.pag_style =
			this["pag_style"] ||
			new SlidesFadePagStyle(undefined, {
				fill: 0x88d7f7,
				r: this.pt(3.2),
			});

		this.initGestureCtrl();
		const { slide_container, pag_wrapper, pag_container } = this;
		this.addChild(slide_container);
		this.addChild(pag_wrapper);
		pag_wrapper.addChild(pag_container);
		{
			slide_container.beginFill(0xff00ff, 0 /*.15*/);
			slide_container.drawRect(0, 0, view_width, slide_max_height);
			slide_container.endFill();
		}
		{
			pag_wrapper.beginFill(0x00ff00, 0 /*.15*/);
			pag_wrapper.drawRect(0, 0, view_width, pag_height);
			pag_wrapper.endFill();
			pag_wrapper.position.set(0, slide_max_height);
		}
	}
	pag_wrapper = new PIXI.Graphics();
	pag_container = new PIXI.Container();
	slide_container = new PIXI.Graphics();
	slide_list: PIXI.Container[] = [];
	private _pag_list: PIXI.Graphics[] = [];
	devicePixelRatio = window.devicePixelRatio;

	pt = px => this.devicePixelRatio * px;
	px = pt => pt / this.devicePixelRatio;

	/**两个slide的间隔*/
	item_span = this.pt(20);
	/**两个dot的间隔*/
	dot_span = this.pt(5);
	/**手势生效的最小范围，只要和起始的位置差异超过了这个值，直接滚动到下一层*/
	effect_gesture_range = this.pt(100);

	addSlide(slide: PIXI.Container) {
		if (this.slide_list.indexOf(slide) !== -1) {
			return;
		}
		this.slide_list.push(slide);
		this.slide_container.addChild(slide);
		this._createPag();
		slide.pivot.set(slide.width / 2, slide.height / 2);
		slide.position.set(slide.pivot.x, slide.pivot.y);
		this.draw();
	}
	/**新建一个点*/
	private _createPag() {
		const pag = new PIXI.Graphics();
		this._pag_list.push(pag);
		this.pag_container.addChild(pag);
		return pag;
	}

	draw() {
		this.drawSlides();
		this.drawPagDots();
		this.emit("refresh-frame");
	}
	/**当前幻灯片，下标*/
	current_slide_index = 0;
	/**切换到下一个幻灯片的进度*/
	private _next_slide_progress = 0;
	get next_slide_progress() {
		return this._next_slide_progress;
	}
	set next_slide_progress(progress) {
		this._next_slide_progress = progress + this.getEdgeForce(progress);
	}
	/**是否有边缘阻力*/
	get isInEdge() {
		const index = this.current_slide_index;
		const len = this.slide_list.length;
		const progress = this.next_slide_progress;
		/// 边缘阻力
		if (index === 0 && progress < 0) {
			return -Infinity;
		}

		if (index === len - 1 && progress > 0) {
			return Infinity;
		}
		return 0;
	}
	/**边缘阻力大小*/
	private getEdgeForce(progress = this.next_slide_progress) {
		const { isInEdge } = this;
		if (isInEdge === -Infinity && progress < -0.2) {
			return -0.2 - progress;
		}
		if (isInEdge === Infinity && progress > 0.2) {
			return 0.2 - progress;
		}
		return 0;
	}

	private _transform_next_slide_progress_to_index() {
		let v = this.next_slide_progress;
		while (v >= 1) {
			v -= 1;
			this.current_slide_index += 1;
		}
		while (v <= -1) {
			v += 1;
			this.current_slide_index -= 1;
		}
		if (!this.isInEdge && Math.abs(v) > 0.5) {
			if (v < 0) {
				//< -0.5
				v += 1;
				this.current_slide_index -= 1;
			} else {
				//> 0.5
				v -= 1;
				this.current_slide_index += 1;
			}
		}
		this.next_slide_progress = v;
	}
	/**动画控制器*/
	slide_ani_ctrl: any;
	/**动画时间*/
	slide_ani_duration = 800;

	/**初始化控制*/
	initGestureCtrl() {
		if (this.interactive) {
			return;
		}
		const { slide_list } = this;
		// 初始化手势动画
		this.interactive = true;
		this.buttonMode = true;

		let start_point: PIXI.Point | undefined;
		let pre_easing_fun: any;
		let diff_x = 0;
		const start_handle = (e: PIXI.interaction.InteractionEvent) => {
			start_point = e.data.global.clone();
			diff_x = 0;
			pre_easing_fun = this.slide_style.easing_fun;
			this.slide_style.easing_fun = Easing.Linear;
			if (this.slide_ani_ctrl) {
				this.slide_ani_ctrl.abort();
				this.slide_ani_ctrl = undefined;
			}
		};
		const moving_handle = (e: PIXI.interaction.InteractionEvent) => {
			if (!start_point) {
				return;
			}
			const cur_point = e.data.global;
			// 往左滑动的话，x减小，next_slide_progress得是正数，这样才能使得current_slide_index+1
			diff_x = start_point.x - cur_point.x;
			this.next_slide_progress = diff_x / this.view_width;
			// 绘制画面
			this.draw();
		};
		const end_handle = (e: PIXI.interaction.InteractionEvent) => {
			if (!start_point) {
				return;
			}
			start_point = undefined;
			this.slide_style.easing_fun = pre_easing_fun;
			pre_easing_fun = undefined;
			// 触发自动next或者回到当前的动画
			let target_diff_x = 0;

			diff_x = this.next_slide_progress * this.view_width;

			if (
				Math.abs(diff_x) >= this.effect_gesture_range &&
				!this.isInEdge
			) {
				target_diff_x = diff_x > 0 ? this.view_width : -this.view_width;
			}
			if (target_diff_x === diff_x) {
				return;
			}
			const ani_duration =
				(Math.abs(Math.abs(target_diff_x) - Math.abs(diff_x)) /
					this.view_width) *
				this.slide_ani_duration;

			const slide_ani_ctrl: any = { abort: () => {} };
			this.slide_ani_ctrl = slide_ani_ctrl;
			AniBase.animateNumber(
				diff_x,
				target_diff_x,
				ani_duration,
				this.slide_style.easing_fun
			)(
				(v, abort) => {
					slide_ani_ctrl.abort = () => {
						this._transform_next_slide_progress_to_index();
						abort();
					};
					// 绘制
					this.next_slide_progress = v / this.view_width;
					this.draw();
				},
				() => {
					this._transform_next_slide_progress_to_index();
					// 动画完成，释放动画控制器
					this.slide_ani_ctrl = undefined;
				}
			);
		};
		this.on("pointerdown", start_handle);
		this.on("pointermove", moving_handle);
		this.on("pointerout", end_handle);
		this.on("pointerup", end_handle);
		this.on("pointerupoutside", end_handle);
	}
	/**绘制卡片*/
	drawSlides() {
		const {
			slide_list,
			current_slide_index,
			next_slide_progress,
			view_width,
			slide_max_height,
		} = this;
		for (var i = 0, len = slide_list.length; i < len; i += 1) {
			const style = this.slide_style.getSlideStyleByIndexDiffAndProgress(
				i - current_slide_index,
				next_slide_progress,
				i,
				len
			);
			// console.log(i, style);

			const slide = slide_list[i];
			slide.visible = style.visible;
			if (!style.visible) {
				// 如果不可见，就不用其它样式属性了
				continue;
			}
			slide.alpha = style.alpha;
			slide.scale.set(style.scale, style.scale);
			slide.x = view_width * style.x_percentage + view_width / 2;
			slide.y =
				slide_max_height * style.y_percentage + slide_max_height / 2;
		}
	}

	pag_span = this.pt(8);
	/**绘制分页导航*/
	drawPagDots() {
		const {
			_pag_list,
			pag_container,
			pag_wrapper,
			pag_span,

			current_slide_index,
			next_slide_progress,
			view_width,
			slide_max_height,
		} = this;
		let acc_width = 0;
		for (var i = 0, len = _pag_list.length; i < len; i += 1) {
			const pag = _pag_list[i];
			this.pag_style.drawPagByIndexDiffAndProgress(
				pag,
				i - current_slide_index,
				next_slide_progress,
				i,
				len
			);
			pag.position.x = acc_width + i * pag_span;
			acc_width += pag.width;
		}
		pag_container.x = (pag_wrapper.width - pag_container.width) / 2;
		pag_container.y = (pag_wrapper.height - pag_container.height) / 2;
	}
}
