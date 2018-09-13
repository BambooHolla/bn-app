import { BlockCard } from "./block-card";
import { iconFontFamily } from "./helper";
export class GoldBlockCard extends BlockCard {
	get style_header_label() {
		const { W } = this;
		return {
			fill: [0xf9a760, 0xfbc554],
			fontSize: W * 0.04,
			fontFamily: iconFontFamily.slice(),
			padding: W * 0.04,
		};
	}
}
