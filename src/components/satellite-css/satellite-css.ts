import {
  Component,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CssAniBase, Easing } from "../AniBase";
import * as PIXI from "pixi.js";
import * as SimplexNoise from "simplex-noise";

@Component({
  selector: "satellite-css",
  templateUrl: "satellite-css.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SatelliteCssComponent extends CssAniBase {
  protected root_circle?: PIXI.Graphics;
  protected ship?: PIXI.Container;
  // protected round_time = /*128*/ 10 * 1000;
  // protected res_time = this.round_time;
  protected circle_width?: number;
  // protected get progress() {
  //   return 1 - this.res_time / this.round_time;
  // }
  // protected ani_progress = 0; // 动画显示用的进度
  // protected ani_deg_speed = Math.PI * 2 / this.round_time; // 默认角速度，deg/ms
  @ViewChild("container") containerRef!: ElementRef;
  @ViewChild("satelliteCtrl") satelliteCtrlRef!: ElementRef;
  satelliteCtrlNode?: HTMLElement;

  _init() {
    this.containerNode ||
      (this.containerNode = this.containerRef.nativeElement);
    this.satelliteCtrlNode ||
      (this.satelliteCtrlNode = this.satelliteCtrlRef.nativeElement);
    return super._init();
  }
  noise = new SimplexNoise();

  constructor() {
    super();
    this.on("init-start", this.initCssApp.bind(this));
    this.on("start-animation", this.startCssApp.bind(this));
    this.on("stop-animation", this.stopCssApp.bind(this));
    this.force_update = true;
  }

  initCssApp() {
    const { pt, containerNode } = this;
    if (!containerNode) {
      throw new Error("call init first");
    }

    // if (this._loop_runs.length!==0) {
    //   this._loop_runs.length = 0;
    // }
  }
  // private _pre_progress = 0;
  // private _dif_progress = 0;
  private _progress = 0;
  set progress(v: number) {
    if (isFinite(v)) {
      // v = Math.max(0, v);
      // v = Math.min(1, v);
      if (v !== this._progress) {
        // this._pre_progress = this._progress;
        this._progress = v;
        // this._dif_progress = v - this._pre_progress;
        // this._add_ms = 0;
        this.emit("progress", v);
        const { satelliteCtrlNode } = this;
        if (satelliteCtrlNode) {
          const rotate = (this._cur_progress_deg =
            360 * this._progress + this._base_progress_deg);
          satelliteCtrlNode.style.cssText = `transform:rotate(${rotate}deg);transition-duration:${
            this._ani_ms
          }ms;transition-timing-function:${this.easing}`;
        }
      }
    }
  }
  get progress() {
    return this._progress;
  }
  private _ani_ms = 500;
  private _add_ms = 0;
  private _cur_progress_deg = 0;
  private _base_progress_deg = 0;

  resetProgress() {
    if (this.satelliteCtrlNode) {
      this._base_progress_deg = this._cur_progress_deg;
    }
    this.setProgress(0, 0);
  }

  setProgress(progress: number, ani_ms?: number, easing?: string) {
    if (ani_ms !== undefined && isFinite(ani_ms) && ani_ms >= 0) {
      this._ani_ms = ani_ms;
    }
    this.progress = progress;
    if (easing) {
      this.easing = easing;
    }
  }
  easing = "linear";

  startCssApp() {
    this.app && this.app.start();
  }

  stopCssApp() {
    this.app && this.app.stop();
  }
}
