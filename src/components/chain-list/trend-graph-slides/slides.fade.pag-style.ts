import { mixFromToStyle } from "./helper";
import { Slides_PagStyle, NumColor } from "./const";
import { AniBase, Easing } from "../../AniBase";

export type PagStyle = {
	alpha: number;
	scale: number;
	tint: NumColor;
	visible: boolean;
	fill: number;
	r: number;
};
export type PagStyleOpts = { [key in keyof PagStyle]?: PagStyle[key] };
export class SlidesFadePagStyle implements Slides_PagStyle {
	constructor(
		/**动画函数*/
		public easing_fun = Easing.Quartic_Out,
		base_style?: PagStyleOpts
	) {
		this._default_style_val = Object.assign(
			this._default_style_val,
			base_style
		);
	}
	private _curr_pag_style: PagStyleOpts = {
		alpha: 1,
	};
	private _prev_pag_style: PagStyleOpts = {
		alpha: 0.2,
		tint: new NumColor(0),
	};
	private _next_pag_style: PagStyleOpts = {
		alpha: 0.2,
		tint: new NumColor(0),
	};
	private _hide_pag_style: PagStyleOpts = {
		alpha: 0.2,
		tint: new NumColor(0),
	};
	private _idnexDiff_style_map = {
		"-1": this._prev_pag_style,
		"0": this._curr_pag_style,
		"1": this._next_pag_style,
	};
	private _default_style_val: PagStyle = {
		alpha: 1,
		scale: 1,
		tint: new NumColor(0xffffff),
		visible: true,
		fill: 0x666666,
		r: 8,
	};
	private _style_keys = Object.keys(this._default_style_val);
	/**根据下标差距与进度获取元素的样式*/
	getPagStyleByIndexDiffAndProgress(
		index_diff: number,
		progress: number,
		index: number,
		len: number
	) {
		return this.mixToPagStyle(
			this._getPagStyleByIndexDiffAndProgress(
				index_diff,
				progress,
				index,
				len
			)
		);
	}
	private _getPagStyleByIndexDiffAndProgress(
		index_diff: number,
		progress: number,
		index: number,
		len: number
	) {
		const {
			_curr_pag_style,
			_prev_pag_style,
			_next_pag_style,
			_hide_pag_style,
			_default_style_val,
			_style_keys,
			// view_width,
			// view_height,
		} = this;
		const from_style: PagStyleOpts =
			this._idnexDiff_style_map[index_diff] || _hide_pag_style;
		if (progress === 0 || from_style === _hide_pag_style) {
			return from_style;
		}
		/// 根据进度算出实际的样式
		let to_style: PagStyleOpts | undefined;
		// index_diff不为0，且与progress同方向时，目标是变为curr
		if (progress * index_diff > 0) {
			to_style = _curr_pag_style;
		}
		// index_diff为0时，目标是变为相反的状态
		if (index_diff === 0) {
			to_style = progress > 0 ? _prev_pag_style : _next_pag_style;
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
		return _hide_pag_style;
	}
	mixToPagStyle(pag_style_opts: PagStyleOpts) {
		return Object.assign(
			{},
			this._default_style_val,
			pag_style_opts
		) as PagStyle;
	}
	private _init_draw_symbol = Symbol("drawed-fad-pag");
	drawPagByIndexDiffAndProgress(
		dot: import("pixi.js").Graphics,
		index_diff: number,
		progress: number,
		index: number,
		len: number
	) {
		const style = this.getPagStyleByIndexDiffAndProgress(
			index_diff,
			progress,
			index,
			len
		);

		const draw_info = `${style.fill},${style.r}`;
		if (dot[this._init_draw_symbol] !== draw_info) {
			dot.clear();
			dot.beginFill(style.fill, 1);
			dot.drawCircle(style.r, style.r, style.r);
			dot.endFill();
			dot.pivot.set(style.r, style.r);
			dot.position.set(style.r, style.r);
			dot[this._init_draw_symbol] = draw_info;
		}
		dot.tint = +style.tint;
		dot.alpha = style.alpha;
		dot.scale.set(style.scale, style.scale);
		dot.visible = style.visible;

		return style;
	}
}
