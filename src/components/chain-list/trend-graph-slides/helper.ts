import { NumColor } from "./const";
import { AniBase, Easing } from "../../AniBase";

/**获取一组数据的大范围，用于Y轴的显示*/
export function calcOutterNearRange(
	list: number[],
	opts?: { min_val?: number }
) {
	/// 最大值和最小值都要进行取整数
	const max = Math.round(Math.max(...list));
	const min = Math.floor(Math.min(...list));
	const diff = max - min;
	/// 默认范围不超过20%，也就是说，至少中间会有60%的区域会用来显示曲线，其余的区域用于留白
	/**顶部最大留白*/
	const top_max_span = 0.2;
	/**底部最大留白*/
	const bot_max_span = 0.2;

	/// 寻找最大值，找一个比较合适的整数，后面0比较多的那种
	const top_max_val = Math.max(max + diff * top_max_span, max + 10);
	const max_dig_num = Math.abs(max).toString().length;
	let top_max: number = 0;
	for (var i = 0; i <= max_dig_num; i += 1) {
		const s = Math.pow(10, max_dig_num - i);
		const try_val = max + s - ((max + s) % s);
		if (try_val <= top_max_val) {
			top_max = try_val;
			break;
		}
	}

	/// 寻找最小值，找一个比较合适的整数，后面0比较多的那种
	const bot_min_val = Math.min(min - diff * bot_max_span, min - 10);
	const min_dig_num = Math.abs(min).toString().length;
	let bot_min: number = 0;
	for (var i = 0; i <= min_dig_num; i += 1) {
		const s = Math.pow(10, min_dig_num - i);
		const try_val = min - s - ((min - s) % s);
		if (try_val >= bot_min_val) {
			bot_min = try_val;
			break;
		}
	}
	if (opts) {
		if (typeof opts.min_val === "number") {
			bot_min = Math.max(opts.min_val, bot_min);
		}
	}

	return [top_max, bot_min];
}
// /**获取一组数据的小范围，用于X轴的显示*/
// export function calcInnerNearRange(list: number[]) {
// 	/// 最大值和最小值都要进行取整数
// 	const max = Math.round(Math.max(...list));
// 	const min = Math.floor(Math.min(...list));
// 	const diff = max - min;
// 	/// 默认范围不超过20%，也就是说，至少中间会有60%的区域会用来显示曲线，其余的区域用于留白
// 	/**右边（大值）最大留白*/
// 	const right_max_span = 0.2;
// 	/**左边（小值）最大留白*/
// 	const left_max_span = 0.2;
// 	const half = Math.round (max+min)/2;

// 	/// 寻找最大值，找一个比较合适的整数，后面0比较多的那种
// 	const right_min_val = Math.max(max- diff * right_max_span, min);
// 	const max_dig_num = Math.abs(max).toString().length;
// 	let top_max: number = 0;
// 	for (var i = 0; i <= max_dig_num; i += 1) {
// 		const s = Math.pow(10, max_dig_num - i);
// 		const try_val = max + s - ((max + s) % s);
// 		if (try_val <= right_min_val) {
// 			top_max = try_val;
// 			break;
// 		}
// 	}

// 	/// 寻找最小值，找一个比较合适的整数，后面0比较多的那种
// 	const left_max_val = Math.min(min + diff * left_max_span, max);
// 	const min_dig_num = Math.abs(min).toString().length;
// 	let bot_min: number = 0;
// 	for (var i = 0; i <= min_dig_num; i += 1) {
// 		const s = Math.pow(10, min_dig_num - i);
// 		const try_val = min - s - ((min - s) % s);
// 		if (try_val >= left_max_val) {
// 			bot_min = try_val;
// 			break;
// 		}
// 	}

// 	return [top_max, bot_min];
// }

/**计算一个范围内的刻度*/
export function calcRangeScale(
	max: number,
	min: number,
	max_scale_num: number,
	base_diff?: number
): [number, number][] {
	max = Math.round(max);
	min = Math.floor(min);
	const diff = max - min;
	let unit_diff = 0;
	let scale_num = max_scale_num - 1;
	if (typeof base_diff !== "number") {
		base_diff = Math.pow(
			10,
			Math.max(Math.floor(diff / 2).toString().length - 1, 0)
		); // diff > 10 ? 10 : 1;
	}
	do {
		unit_diff = diff / scale_num;
		scale_num -= 1;
		if (scale_num <= 0) {
			return [[0, max], [1, min]];
		}
	} while (unit_diff <= base_diff);
	if (unit_diff > 10) {
		unit_diff = Math.floor(unit_diff / 10) * 10;
	} else {
		unit_diff = Math.floor(unit_diff);
	}

	const unit_rate = unit_diff / diff;
	const res: [number, number][] = [];
	let acc_rate = 0;
	let acc_val = max;
	do {
		res.push([acc_rate, acc_val]);
		acc_rate += unit_rate;
		acc_val -= unit_diff;
	} while (acc_val >= min + unit_diff);
	res.push([1, min]);
	return res;

	// max
	// min
	// max_scale_num
}
export type ObjectOptionsType<T> = { [key in keyof T]?: T[key] };

export function mixFromToStyle<T>(
	default_style: T,
	from_style: ObjectOptionsType<T>,
	to_style: ObjectOptionsType<T>,
	easing_fun: (k: number) => number,
	progress: number,
	_style_keys = Object.keys(default_style)
) {
	const abs_progress = Math.abs(progress);
	const pv = easing_fun(abs_progress);
	const ani_style: ObjectOptionsType<T> = {};
	for (var key of _style_keys) {
		const from_val =
			key in from_style ? from_style[key] : default_style[key];
		const to_val = key in to_style ? to_style[key] : default_style[key];
		if (from_val === to_val) {
			ani_style[key] = to_val;
		} else if (typeof from_val === "number") {
			// number类型的，可以进行动画
			ani_style[key] = from_val + (to_val - from_val) * pv;
		} else if (from_val instanceof NumColor) {
			// number color类型的，可以动画
			const from_color = AniBase.numberToColor(+from_val);
			const to_color = AniBase.numberToColor(+to_val);
			const diff_color = from_color.map(
				(from_v, i) => to_color[i] - from_v
			);
			const cur_color = from_color.map(
				(from_v, i) => (from_v + (to_color[i] - from_v) * pv) | 0
			);
			ani_style[key] = new NumColor(
				(cur_color[0] << 16) + (cur_color[1] << 8) + cur_color[2]
			);
		} else {
			// 未知类型的，根据进度取值，理论上不应该使用这个
			ani_style[key] = abs_progress <= 0.5 ? from_val : to_val;
		}
	}
	return ani_style as T;
}
