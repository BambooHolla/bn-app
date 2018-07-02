import { Component, ViewChild, ElementRef } from "@angular/core";
import { AniBase, Easing } from "../AniBase";
import * as PIXI from "pixi.js";

@Component({
	selector: "sync-progress-spinner",
	templateUrl: "sync-progress-spinner.html",
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
			this.app = SyncProgressSpinnerComponent.PIXIAppbuilder({
				view: canvasNode,
				width: canvasNode.clientWidth,
				height: canvasNode.clientHeight,
				transparent: false,
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
		const ps1 = new ProgressSpinner(
			[[0, "#fccd51"], [1, "#f9a561"]],
			unit_r,
			size,
		);
		const ps2 = new ProgressSpinner(
			[[0, "#ffa881"], [1, "#ff6666"]],
			unit_r,
			size - unit_size,
		);
		const ps3 = new ProgressSpinner(
			[[0, "#3ce6d7"], [1, "#3ecdeb"]],
			unit_r,
			size - unit_size * 2,
		);
		this.app.stage.addChild(ps1);
		this.app.stage.addChild(ps2);
		this.app.stage.addChild(ps3);
		ps1.x = size / 2; //(size - ps1.width) / 2;
		ps2.x = size / 2; //(size - ps2.width) / 2;
		ps3.x = size / 2; //(size - ps3.width) / 2;
		ps1.y = size / 2; //(size - ps1.height) / 2;
		ps2.y = size / 2; //(size - ps2.height) / 2;
		ps3.y = size / 2; //(size - ps3.height) / 2;
		this.progress_spinner_list.push(ps1);
		this.progress_spinner_list.push(ps2);
		this.progress_spinner_list.push(ps3);
		this._ani_p(0);
		this._ani_p(1);
		this._ani_p(2);
	}
	private _ani_p(index: number) {
		const ps = this.progress_spinner_list[index];
		const ani_ms = Math.min(Math.random() * 3000, 500);
		ps.setProgress(Math.random(), ani_ms);
		setTimeout(() => {
			this._ani_p(index);
		}, ani_ms);
	}
}

class ProgressSpinner extends PIXI.Container {
	constructor(
		public gradient_stops: Array<[number, string]>,
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
	graphice_bg!: PIXI.Sprite;
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

		const linearGradient = AniBase.createLinearGradient(
			full_w,
			full_w,
			this.gradient_stops,
		);
		const texture = PIXI.Texture.fromCanvas(linearGradient);
		this.graphice_bg = new PIXI.Sprite(texture);

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
		if (typeof ani_ms === "number") {
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
