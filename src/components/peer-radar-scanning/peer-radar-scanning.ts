import {
	Component,
	ViewChild,
	ElementRef,
	Input,
	ChangeDetectionStrategy,
} from "@angular/core";
import { AniBase, Easing } from "../AniBase";
import { BlizzardHash } from "../../bnqkl-framework/BlizzardHash";

import * as PIXI from "pixi.js";

const IS_ANI_END_SYMBOL = Symbol("is_ani_end");
const ANI_PROGRESS_SYMBOL = Symbol("ani_progress");
const PEER_POS_SYMBOL = Symbol("peer_pos");

@Component({
	selector: "peer-radar-scanning",
	templateUrl: "peer-radar-scanning.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeerRadarScanningComponent extends AniBase {
	@ViewChild("canvas") canvasRef!: ElementRef;
	constructor() {
		super();
		this.force_update = true;
		this.on("init-start", this.initPixiApp.bind(this));
	}
	_init() {
		const canvasNode: HTMLCanvasElement =
			this.canvasNode || (this.canvasNode = this.canvasRef.nativeElement);
		return super._init();
	}
	initPixiApp() {
		if (this.app) {
			this.app.stage.children.slice().forEach(child => {
				return child.destroy();
			});
			this._loop_runs.length = 0;
		} else {
			const { pt, px, canvasNode } = this;
			if (!canvasNode) {
				throw new Error("call init first");
			}
			const size = Math.min(
				canvasNode.parentElement
					? canvasNode.parentElement.clientWidth
					: canvasNode.clientWidth,
				canvasNode.parentElement
					? canvasNode.parentElement.clientHeight
					: canvasNode.clientHeight,
			);
			this.app = PeerRadarScanningComponent.PIXIAppbuilder({
				view: canvasNode,
				width: pt(size),
				height: pt(size),
				transparent: true,
				antialias: true,
				autoStart: true,
			});
		}

		this._draw_init();
	}
	private _peer_list: string[] = [];
	get peer_list() {
		return this._peer_list;
	}
	@Input("peer-list")
	set peer_list(v) {
		this._peer_list = v;
		const { R } = this;
		if (R) {
			this.drawPeerPoints(R * 0.03, R);
		}
	}
	private _calcPeerPosXY(peer: string) {
		const str_center_index = peer.length / 2;
		const px = BlizzardHash.inRangePosition(
			BlizzardHash.hashString(peer.substr(0, str_center_index), 0),
		);
		const py = BlizzardHash.inRangePosition(
			BlizzardHash.hashString(peer.substr(str_center_index), 0),
		);

		const deg = px * Math.PI * 2;
		const base_x = Math.cos(deg);
		const base_y = Math.sin(deg);

		return [base_x * py, base_y * py];
	}

	peer_points_container = new PIXI.Container();

	lines: PIXI.Graphics[] = [];
	line_init_speed = 0.2; // 初始速度，尽快显示成完全体，然后再进入line_normal_speed
	line_normal_speed = 0.05; // 正常速度
	line_speed = 0.05;
	R = 0;

	scanner = new PIXI.Graphics();
	_draw_init() {
		if (!this.app) {
			return;
		}
		const { scanner, peer_points_container } = this;
		const { renderer, stage } = this.app;
		const { width: W, height: H } = renderer;
		const minSize = Math.min(W, H);
		const R = minSize / 2;
		this.R = R;
		const ring_width = R * 0.12;

		/*扫描跟着其中某一个进度走*/
		const loop_ani_line = () => {
			const free_lines = this.lines.filter(l => l[IS_ANI_END_SYMBOL]);
			let ani_line = free_lines[free_lines.length - 1];
			// 至少要有一个空闲的
			if (free_lines.length < 2) {
				ani_line = new PIXI.Graphics();
				// ani_line.alpha = 0.6;
				this.lines.push(ani_line);
				let zz = false;
				ani_line.on("init-ani", () => {
					ani_line.scale.set(0, 0);
					zz = false;
				});
				ani_line.on("progress", p => {
					// p = Math.sqrt(p);
					const P = p; //Easing.Circular_Out(p);
					ani_line.scale.set(P, P);
					// ani_line.alpha = Easing.Circular_Out(1 - p);
					if (p > 0.26 && !zz) {
						zz = true;
						// 使用微任务，等所有的progress都更新完了在去做下一步
						Promise.resolve().then(() => {
							loop_ani_line();
						});
					}
				});
			}

			this.init_line(stage, ani_line, R, ring_width);
			const running_lines = this.lines.filter(l => !l[IS_ANI_END_SYMBOL]);
			const pre_index =
				(running_lines.indexOf(ani_line) - 1 + running_lines.length) %
				running_lines.length;
			const pre_line = running_lines[pre_index];
			ani_line.rotation =
				pre_line.rotation + pre_line[ANI_PROGRESS_SYMBOL] * Math.PI * 4;
			return ani_line;
		};
		loop_ani_line();
		this.init_scanner(stage, R, ring_width);
		scanner.scale.set(0, 0);
		this.line_speed = this.line_init_speed;
		const follow_last_line = () => {
			const progress_num_list: number[] = [];
			const progress_line_map: { [progress: number]: PIXI.Graphics } = {};
			this.lines.forEach(l => {
				const p = l[ANI_PROGRESS_SYMBOL];
				if (p !== 1) {
					progress_num_list.push(p);
					progress_line_map[p] = l;
				}
			});

			const last_line = progress_line_map[Math.max(...progress_num_list)];
			const follow_progress = p => {
				if (p > scanner.scale.x) {
					this.line_speed =
						p * (this.line_normal_speed - this.line_init_speed) +
						this.line_init_speed;
					scanner.scale.set(p, p);
				}
				scanner.rotation = p * Math.PI * 4 + last_line.rotation;
			};
			last_line.on("progress", follow_progress);
			follow_progress(last_line[ANI_PROGRESS_SYMBOL]);
			last_line.once("end-ani", () => {
				last_line.off("progress", follow_progress);
				follow_last_line();
			});
		};
		follow_last_line();

		this.init_peer_points_container(stage, R);
		// 进行初始化绘制
		this.peer_list = this.peer_list;
	}

	init_line(
		stage: PIXI.Container,
		line: PIXI.Graphics,
		R: number,
		ring_width: number,
	) {
		if (IS_ANI_END_SYMBOL in line) {
			line.emit("init-ani");
			return;
		}
		stage.addChild(line);
		const line_footer = new PIXI.Graphics();
		// line_footer.lineStyle(2, 0x000000, 1);
		line_footer.beginFill(0xffffff);
		// line_footer.moveTo(R,0);
		// line_footer.arcTo(R, 0, R, R, R/2);
		/*先画内圈*/
		line_footer.moveTo(R, R + R - ring_width);
		line_footer.arcTo(
			R + R - (ring_width * 3) / 4,
			R + R - ring_width,
			R + R - (ring_width * 3) / 4,
			R,
			R - (ring_width * 3) / 4,
		);
		line_footer.arcTo(
			R + R - (ring_width * 3) / 4,
			(ring_width * 2) / 4,
			R,
			(ring_width * 2) / 4,
			R - (ring_width * 2) / 4,
		);
		line_footer.arcTo(
			(ring_width * 1) / 4,
			(ring_width * 2) / 4,
			(ring_width * 1) / 4,
			R,
			R - (ring_width * 1) / 4,
		);
		line_footer.arcTo((ring_width * 1) / 4, R + R, R, R + R, R);
		/*再画外圈*/
		line_footer.arcTo(0, R + R, 0, R, R);
		line_footer.arcTo(0, 0, R, 0, R);
		line_footer.arcTo(R + R, 0, R + R, R, R);
		line_footer.arcTo(R + R, R + R, R, R + R, R);
		line_footer.closePath();
		line_footer.endFill();
		// line_footer.cacheAsBitmap = true;

		line.addChild(line_footer);

		/*彗星圆的遮罩*/
		const line_footer_mask = new PIXI.Graphics();

		const init_angle = Math.PI / 2;
		let start_angle = init_angle;
		let acc_angle = start_angle;
		const total_ani_angle = Math.PI * 4;
		const draw_line_footer_mask = () => {
			line_footer_mask.clear();
			if (Math.abs(start_angle - acc_angle) >= Number.EPSILON) {
				line_footer_mask.beginFill(0x000000, 0);
				line_footer_mask.arc(R, R, R * 1.1, start_angle, acc_angle);
				line_footer_mask.lineTo(R, R);
				line_footer_mask.closePath();
				line_footer_mask.endFill();
			}
		};
		line.addChild(line_footer_mask);

		/*动画函数*/
		const ani_line_footer_mask = () => {
			acc_angle += this.line_speed;
			const progress = Math.max(
				Math.min((acc_angle - init_angle) / total_ani_angle, 1),
				0,
			);
			line[ANI_PROGRESS_SYMBOL] = progress;
			line.emit("progress", progress);
			draw_line_footer_mask();
			if (acc_angle - start_angle >= Math.PI * 2) {
				if (line_footer.mask !== line_footer_mask) {
					Promise.resolve().then(() => {
						this.removeLoop(ani_line_footer_mask);
						line[IS_ANI_END_SYMBOL] = true;
						line.emit("end-ani");
					});
					return;
				}
				start_angle += Math.PI * 2;
				// acc_angle = start_angle;
				draw_line_footer_mask();
				// 切换遮罩
				line_footer.mask = null;
				full_line.mask = line_footer_mask;
				full_line.visible = true;
				line.emit("half-ani");
			}
		};

		/*完美圆的绘制*/
		const full_line = new PIXI.Graphics();
		const draw_circle = (gra, R, r_x, r_y) => {
			if (r_x === 0) {
				gra.moveTo(r_x + R, r_y + R + R);
			} else {
				gra.lineTo(r_x + R, r_y + R + R);
			}
			gra.arcTo(r_x + 0, r_y + R + R, r_x + 0, r_y + R, R);
			gra.arcTo(r_x + 0, r_y + 0, r_x + R, r_y + 0, R);
			gra.arcTo(r_x + R + R, r_y + 0, r_x + R + R, r_y + R, R);
			gra.arcTo(r_x + R + R, r_y + R + R, r_x + R, r_y + R + R, R);
		};
		full_line.beginFill(0xffffff, 1);
		full_line.moveTo(R, R + R);
		full_line.arcTo(0, R + R, 0, R, R);
		full_line.arcTo(0, 0, R, 0, R);
		full_line.arcTo(R + R, 0, R + R, R, R);
		full_line.arcTo(R + R, R + R, R, R + R, R);
		const r = R - ring_width;
		const rx = x => x + ring_width;
		const ry = y => y + ring_width;
		full_line.lineTo(rx(r), ry(r + r));
		full_line.arcTo(rx(r + r), ry(r + r), rx(r + r), ry(r), r);
		full_line.arcTo(rx(r + r), ry(0), rx(r), ry(0), r);
		full_line.arcTo(rx(0), ry(0), rx(0), ry(r), r);
		full_line.arcTo(rx(0), ry(r + r), rx(r), ry(r + r), r);
		full_line.closePath();
		full_line.endFill();
		line.addChild(full_line);

		// 初始化动画
		line.on("init-ani", () => {
			start_angle = init_angle;
			acc_angle = start_angle;
			line[ANI_PROGRESS_SYMBOL] = 0;
			line[IS_ANI_END_SYMBOL] = false;
			draw_line_footer_mask();
			/*设置遮罩*/
			line_footer.mask = line_footer_mask;
			full_line.mask = null;
			full_line.visible = false;
			/*开始动画*/
			this.addLoop(ani_line_footer_mask);
		});
		line.emit("init-ani");
		line.pivot.set(R, R);
		line.position.set(R, R);
	}
	init_scanner(stage: PIXI.Container, R: number, ring_width: number) {
		const { scanner } = this;
		stage.addChild(scanner);
		scanner.beginFill(0xffffff, 1);
		scanner.drawCircle(R, R, (ring_width * 2) / 3);
		const rect_w = ring_width / 2;
		scanner.drawRect(R - rect_w / 2, R, rect_w, R);
		scanner.endFill();
		scanner.pivot.set(R, R);
		scanner.position.set(R, R);
	}
	init_peer_points_container(stage: PIXI.Container, R: number) {
		const { peer_points_container } = this;
		stage.addChild(peer_points_container);
		peer_points_container.pivot.set(R, R);
		peer_points_container.position.set(R, R);
		peer_points_container.scale.set(0.8, 0.8);
	}
	drawPeerPoints(r: number, R: number) {
		const { peer_points_container, peer_list } = this;
		const peer_list_set = new Set<string>(peer_list);

		const rms: PIXI.DisplayObject[] = [];
		peer_points_container.children.forEach(peer_container => {
			const peer_info = peer_container[PEER_POS_SYMBOL];
			// 复用相同的点
			if (peer_list_set.has(peer_info)) {
				return peer_list_set.delete(peer_info);
			}
			// 多余的点，准备移除
			if (peer_list_set.size === 0) {
				return rms.push(peer_container);
			}
			// 复用存在的点
			const peer = peer_list_set.values().next().value;
			peer_container[PEER_POS_SYMBOL] = peer;
			const [x, y] = this._calcPeerPosXY(peer);
			peer_container.x = R * x + R;
			peer_container.y = R * y + R;
		});
		// 补足缺少的点
		peer_list_set.forEach(peer => {
			const [x, y] = this._calcPeerPosXY(peer);
			const peer_container = new PIXI.Graphics();
			peer_container[PEER_POS_SYMBOL] = peer;
			peer_container.beginFill(0xffffff);
			peer_container.drawCircle(r, r, r);
			peer_container.endFill();
			peer_container.x = R * x + R;
			peer_container.y = R * y + R;
			peer_points_container.addChild(peer_container);
		});
		// 移除多余的点
		rms.forEach(peer_container => {
			peer_points_container.removeChild(peer_container);
			peer_container.destroy();
		});
	}
}
