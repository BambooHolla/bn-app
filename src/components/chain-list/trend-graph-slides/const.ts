export type SlideStyle = {
	alpha: number;
	scale: number;
	visible: boolean;
	x_percentage: number;
	y_percentage: number;
};
export type SlideStyleOpts = { [key in keyof SlideStyle]?: SlideStyle[key] };
export interface Slides_SlideStyle {
	easing_fun: (k: number) => number;
	getSlideStyleByIndexDiffAndProgress: (
		index_diff: number,
		progress: number,
		index: number,
		len: number
	) => SlideStyle;
}

export interface Slides_PagStyle {
	easing_fun: (k: number) => number;
	// getPagStyleByIndexDiffAndProgress: (
	// 	index_diff: number,
	// 	progress: number,
	// 	index: number,
	// 	len: number
	// ) => PagStyle;
	drawPagByIndexDiffAndProgress: (
		dot: import("pixi.js").Graphics,
		index_diff: number,
		progress: number,
		index: number,
		len: number
	) => void;
}
export class NumColor {
	constructor(private _color_num: number) {}
	valueOf() {
		return this._color_num;
	}
}
