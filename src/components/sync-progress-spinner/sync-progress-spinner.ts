import {
	Component,
	ViewChild,
	ElementRef,
	Input,
	ChangeDetectionStrategy,
} from "@angular/core";
import { AniBase, Easing } from "../AniBase";
import * as PIXI from "pixi.js";

@Component({
	selector: "sync-progress-spinner",
	templateUrl: "sync-progress-spinner.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncProgressSpinnerComponent extends AniBase {
	@ViewChild("canvas") canvasRef!: ElementRef;
	constructor() {
		super();
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
			this.app = SyncProgressSpinnerComponent.PIXIAppbuilder({
				view: canvasNode,
				width: pt(size),
				height: pt(size),
				transparent: true,
				antialias: true,
				autoStart: true,
				backgroundColor: 0xffffff,
			});
		}

		this._draw_init();
	}
	progress_spinner_list: ProgressSpinner[] = [];
	_draw_init() {
		if (!this.app) {
			return;
		}
		const { renderer } = this.app;
		const size = Math.min(renderer.width, renderer.height);
		const unit_size = size / 5.3; // 这里的比例与颜色都是根据设计图来的
		const unit_r = unit_size * 0.2;
		this._generateProgressSpinner(
			[[0, "#fccd51"], [1, "#f9a561"]] as Array<[number, string]>,
			unit_r,
			size,
			size,
		);
		this._generateProgressSpinner(
			[[0, "#ffa881"], [1, "#ff6666"]] as Array<[number, string]>,
			unit_r,
			size - unit_size,
			size,
		);
		this._generateProgressSpinner(
			[[0, "#3ce6d7"], [1, "#3ecdeb"]] as Array<[number, string]>,
			unit_r,
			size - unit_size * 2,
			size,
		);
		this.forceRenderOneFrame();
	}
	private _generateProgressSpinner(
		gradient_stops: Array<[number, string]> | number | [number, number],
		arc_width: number,
		spinner_width: number,
		size: number,
	) {
		const ps = new ProgressSpinner(
			gradient_stops,
			arc_width,
			spinner_width,
		);
		const ps_bg = new ProgressSpinner(
			// [0xcbcbcb, 0.8],
			0xe5e5e5,
			arc_width,
			spinner_width,
		);
		ps_bg.cacheAsBitmap = true;
		this.app!.stage.addChild(ps_bg);
		this.app!.stage.addChild(ps);
		ps_bg.x = size / 2;
		ps_bg.y = size / 2;
		ps.x = size / 2; //(size - ps.width) / 2;
		ps.y = size / 2; //(size - ps.height) / 2;
		this.progress_spinner_list.push(ps);
		ps.on("refresh-frame", () => {
			this.forceRenderOneFrame();
		});
		// // 进行随机动画
		// this._ani_p(this.progress_spinner_list.length - 1);
	}
	// private _ani_p(index: number) {
	// 	const ps = this.progress_spinner_list[index];
	// 	const ani_ms = Math.min(Math.random() * 3000, 500);
	// 	ps.setProgress(Math.random(), ani_ms);
	// 	setTimeout(() => {
	// 		this._ani_p(index);
	// 	}, ani_ms);
	// }
	getPS(index: number) {
		return this.progress_spinner_list[index];
	}
	get ps1() {
		return this.getPS(0);
	}
	get ps2() {
		return this.getPS(1);
	}
	get ps3() {
		return this.getPS(2);
	}

	_ps1_progress: [number, number] = [0, 0];
	get ps1_progress() {
		return this._ps1_progress;
	}
	@Input("ps-1")
	set ps1_progress(v) {
		this._ps1_progress = v;
		this.ps1.setProgress(v[0], v[1]);
	}
	_ps2_progress: [number, number] = [0, 0];
	get ps2_progress() {
		return this._ps2_progress;
	}
	@Input("ps-2")
	set ps2_progress(v) {
		this._ps2_progress = v;
		this.ps2.setProgress(v[0], v[1]);
	}
	_ps3_progress: [number, number] = [0, 0];
	get ps3_progress() {
		return this._ps3_progress;
	}
	@Input("ps-3")
	set ps3_progress(v) {
		this._ps3_progress = v;
		this.ps3.setProgress(v[0], v[1]);
	}
}

export class ProgressSpinner extends PIXI.Container {
	constructor(
		public gradient_stops:
			| Array<[number, string]>
			| number
			| [number, number],
		public arc_width: number,
		public spinner_width: number,
	) {
		super();
		this.initDraw();
		this.addChild(this.graphice_bg);
		this.addChild(this.progress_arc);
		// this.progress_arc.cacheAsBitmap = true;
		this.graphice_bg.mask = this.progress_arc;
		// this.rotation = -90;
	}
	progress = 1;
	graphice_bg!: PIXI.Sprite | PIXI.Graphics;
	progress_arc = new PIXI.Graphics();
	initDraw() {
		const stroke_w = this.arc_width;
		const stroke_w_2 = stroke_w / 2;
		const full_w = this.spinner_width;
		const full_w_2 = full_w / 2;
		// 设置画布中心点，方便旋转与定位
		this.pivot.set(full_w_2, full_w_2);
		this.position.set(full_w_2, full_w_2);
		// 旋转90度
		this.rotation = -Math.PI / 2;
		const { gradient_stops } = this;
		if (
			gradient_stops instanceof Array &&
			gradient_stops[0] instanceof Array
		) {
			const linearGradient = AniBase.createLinearGradient(
				full_w,
				full_w,
				gradient_stops as any,
			);
			const texture = PIXI.Texture.fromCanvas(linearGradient);
			this.graphice_bg = new PIXI.Sprite(texture);
		} else {
			const g = new PIXI.Graphics();
			if (gradient_stops instanceof Array) {
				g.beginFill(
					gradient_stops[0] as number,
					gradient_stops[1] as number,
				);
			} else {
				g.beginFill(gradient_stops);
			}
			g.drawRect(0, 0, full_w, full_w);
			g.endFill();
			this.graphice_bg = g;
		}
		// 画未完成的进度圆弧
		const { progress_arc } = this;
		// progress_arc.beginFill(0xffffff);
		const total_angle = (Math.PI * 3) / 2;
		const progress_angle = Math.PI * 2 - total_angle * this.progress;

		const outter_arc_info = this.getArcPoints(
			progress_angle,
			full_w_2,
			full_w_2,
			full_w_2 - stroke_w_2,
		);
		progress_arc.lineStyle(stroke_w);
		progress_arc.moveTo(outter_arc_info.start_x, outter_arc_info.start_y);
		progress_arc.arc(
			outter_arc_info.x,
			outter_arc_info.y,
			outter_arc_info.r,
			0,
			progress_angle,
			true,
		);

		progress_arc.lineStyle(0);
		progress_arc.beginFill(0);
		progress_arc.drawCircle(
			outter_arc_info.start_x,
			outter_arc_info.start_y,
			stroke_w_2,
		);
		progress_arc.drawCircle(
			outter_arc_info.end_x,
			outter_arc_info.end_y,
			stroke_w_2,
		);
		progress_arc.endFill();
	}
	private _progress_ani_id;
	setProgress(new_progress: number, ani_ms?: number) {
		if (
			!(
				typeof new_progress === "number" &&
				!isNaN(new_progress) &&
				this.progress !== new_progress
			)
		) {
			return;
		}
		const old_progress = this.progress;
		this.progress = new_progress;
		if (typeof ani_ms === "number" && ani_ms) {
			const ani_ctrl_id = performance.now();
			this._progress_ani_id = ani_ctrl_id;
			AniBase.animateNumber(
				old_progress,
				new_progress,
				ani_ms,
				Easing.Quadratic_InOut,
			)((v, abort) => {
				if (this._progress_ani_id !== ani_ctrl_id) {
					abort();
					return;
				}
				this.setProgress(v);
			});
			return;
		}
		const stroke_w = this.arc_width;
		const stroke_w_2 = stroke_w / 2;
		const full_w = this.spinner_width;
		const full_w_2 = full_w / 2;
		// this.progress_arc.cacheAsBitmap = false;
		const { progress_arc } = this;
		progress_arc.clear();
		// progress_arc.beginFill(0xffffff);
		const total_angle = (Math.PI * 3) / 2;
		const progress_angle = Math.PI * 2 - total_angle * new_progress;

		const outter_arc_info = this.getArcPoints(
			progress_angle,
			full_w_2,
			full_w_2,
			full_w_2 - stroke_w_2,
		);
		progress_arc.lineStyle(stroke_w);
		progress_arc.moveTo(outter_arc_info.start_x, outter_arc_info.start_y);
		progress_arc.arc(
			outter_arc_info.x,
			outter_arc_info.y,
			outter_arc_info.r,
			0,
			progress_angle,
			true,
		);

		progress_arc.lineStyle(0);
		progress_arc.beginFill(0);
		progress_arc.drawCircle(
			outter_arc_info.start_x,
			outter_arc_info.start_y,
			stroke_w_2,
		);
		progress_arc.drawCircle(
			outter_arc_info.end_x,
			outter_arc_info.end_y,
			stroke_w_2,
		);
		progress_arc.endFill();
		this.emit("refresh-frame");
	}
	is_disabled = false;
	setDisabled(is_disabled: boolean) {
		if (this.is_disabled === is_disabled) {
			return;
		}
		this.is_disabled = is_disabled;
		this.graphice_bg.blendMode = is_disabled
			? PIXI.BLEND_MODES.MULTIPLY
			: PIXI.BLEND_MODES.NORMAL;
		this.emit("refresh-frame");
	}
	getArcPoints(angle: number, x: number, y: number, r: number) {
		return {
			start_x: x + r,
			start_y: y,
			end_x: x + Math.cos(angle) * r,
			end_y: y + Math.sin(angle) * r,
			x,
			y,
			r,
		};
	}
}
