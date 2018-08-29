import { mixFromToStyle } from "./helper";
import { SlideStyle, SlideStyleOpts, Slides_SlideStyle } from "./const";
import { AniBase, Easing } from "../../AniBase";
export class SlidesFadeSlideStyle implements Slides_SlideStyle {
	constructor(
		/**动画函数*/
		public easing_fun = Easing.Quartic_Out
	) {}

	private _curr_slide_style: SlideStyleOpts = {
		alpha: 1,
		scale: 1,
	};
	private _prev_slide_style: SlideStyleOpts = {
		alpha: 0.4,
		scale: 0.8,
		x_percentage: -1,
	};
	private _next_slide_style: SlideStyleOpts = {
		alpha: 0.4,
		scale: 0.8,
		x_percentage: 1,
	};
	private _hide_slide_style: SlideStyleOpts = {
		visible: false,
	};
	private _idnexDiff_style_map = {
		"-1": this._prev_slide_style,
		"0": this._curr_slide_style,
		"1": this._next_slide_style,
	};
	private _default_style_val: SlideStyle = {
		alpha: 1,
		scale: 1,
		visible: true,
		x_percentage: 0,
		y_percentage: 0,
	};
	private _style_keys = Object.keys(this._default_style_val);
	/**根据下标差距与进度获取元素的样式*/
	getSlideStyleByIndexDiffAndProgress(
		index_diff: number,
		progress: number,
		index: number,
		len: number
	) {
		return this.mixToSlideStyle(
			this._getSlideStyleByIndexDiffAndProgress(
				index_diff,
				progress,
				index,
				len
			)
		);
	}
	private _getSlideStyleByIndexDiffAndProgress(
		index_diff: number,
		progress: number,
		index: number,
		len: number
	) {
		const {
			_curr_slide_style,
			_prev_slide_style,
			_next_slide_style,
			_hide_slide_style,
			_default_style_val,
			_style_keys,
			// view_width,
			// view_height,
		} = this;
		const from_style: SlideStyleOpts =
			this._idnexDiff_style_map[index_diff] || _hide_slide_style;
		if (progress === 0 || from_style === _hide_slide_style) {
			return from_style;
		}
		/// 根据进度算出实际的样式
		let to_style: SlideStyleOpts | undefined;
		// index_diff不为0，且与progress同方向时，目标是变为curr
		if (progress * index_diff > 0) {
			to_style = _curr_slide_style;
		}
		// index_diff为0时，目标是变为相反的状态
		if (index_diff === 0) {
			to_style = progress > 0 ? _prev_slide_style : _next_slide_style;
		}
		// 开始计算
		if (to_style) {
			return mixFromToStyle(
				_default_style_val,
				from_style,
				to_style,
				this.easing_fun,
				progress,
				_style_keys
			);
		}

		// 没有目标的情况，不显示
		return _hide_slide_style;
	}
	mixToSlideStyle(slide_style_opts: SlideStyleOpts) {
		return Object.assign(
			{},
			this._default_style_val,
			slide_style_opts
		) as SlideStyle;
	}
}
