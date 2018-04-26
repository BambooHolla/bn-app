import {
  Component,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import { AniBase, Easing } from "../AniBase";
import * as PIXI from "pixi.js";
import * as SimplexNoise from "simplex-noise";

@Component({
  selector: "satellite-pixi",
  templateUrl: "satellite-pixi.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SatellitePixiComponent extends AniBase {
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
  @ViewChild("canvas") canvasRef!: ElementRef;

  _init() {
    this.canvasNode ||
      (this.canvasNode = this.canvasRef.nativeElement as HTMLCanvasElement);
    return super._init();
  }
  noise = new SimplexNoise();

  constructor() {
    super();
    this.on("init-start", this.initPixiApp.bind(this));
    this.on("start-animation", this.startPixiApp.bind(this));
    this.on("stop-animation", this.stopPixiApp.bind(this));
    this.force_update = true;
  }

  initPixiApp() {
    if (this.app) {
      this.app.stage.children.slice().forEach(child => {
        return child.destroy();
      });
      this._loop_runs.length = 0;
    }

    const { canvasNode, pt } = this;
    if (!canvasNode) {
      throw new Error("call init first");
    }
    if (!this.app) {
      this.app = this.PIXIAppbuilder({
        antialias: true,
        transparent: true,
        view: canvasNode,
        height: pt(canvasNode.clientHeight),
        width: pt(canvasNode.clientWidth),
        autoStart: false,
      });
    }
    const app = this.app;

    const { stage, renderer, ticker } = app;
    const root_circle = (this.root_circle = new PIXI.Graphics());

    const circle_width = (this.circle_width = renderer.width / 2 - 50);

    stage.addChild(root_circle);
    root_circle.x = renderer.width / 2;
    root_circle.y = renderer.height / 2;

    const point_num = 180;
    const u_deg = Math.PI * 2 / point_num;
    root_circle.beginFill(0xf7d13f, 1);
    for (let i = 0; i < point_num; i += 1) {
      const deg = u_deg * i;
      const x = Math.sin(deg) * circle_width;
      const y = Math.cos(deg) * circle_width;
      root_circle.drawCircle(x, y, pt(0.8));
    }
    root_circle.endFill();
    root_circle.cacheAsBitmap = true;

    const ship = (this.ship = new PIXI.Container());
    const ship_body = new PIXI.Graphics();
    ship_body.beginFill(0xfed001, 0.3);
    ship_body.drawCircle(0, 0, pt(12));
    ship_body.endFill();
    ship_body.beginFill(0xfed001);
    ship_body.drawCircle(0, 0, pt(8));
    ship_body.endFill();
    ship_body.lineStyle(pt(1), 0xfed001);
    // ship_body.drawCircle(0, 0, 6.5 * devicePixelRatio);
    ship_body.arc(0, 0, pt(12 + 0.5), Math.PI / 2, -Math.PI / 2);
    ship_body.cacheAsBitmap = true;
    ship.addChild(ship_body);
    const tails: PIXI.Graphics[] = [];
    const min_tail_length = pt(12);
    const max_tail_length = pt(20);
    const tails_num = 5;
    const center_tail_index = (tails_num - 1) / 2;
    const from_deg = 0;
    const to_deg = Math.PI;
    const base_diff_x = pt(1);

    for (let i = 0; i < tails_num; i += 1) {
      const tail = (tails[i] = new PIXI.Graphics());
      tail.lineStyle(pt(1), 0xfed001);
      const tail_len =
        min_tail_length +
        (max_tail_length - min_tail_length) *
          (1 - Math.abs(center_tail_index - i) / center_tail_index);
      const deg = i / (tails_num - 1) * (to_deg - from_deg) + from_deg;
      const x = Math.sin(deg) * 25;
      const y = Math.cos(deg) * 25;
      tail.moveTo(0, 0);
      tail.lineTo(tail_len, 0);
      ship.addChild(tail);
      tail.x = x + base_diff_x;
      tail.y = y;
    }

    stage.addChild(ship);
    ship.cacheAsBitmap = true;

    // // 推进器火焰动画
    // this._loop_runs.push(() => {
    //   for (let tail of tails) {
    //     if (tail.scale.x > 1) {
    //       tail.scale.x -= 0.05;
    //     } else {
    //       tail.scale.x += Math.random();
    //     }
    //   }
    // });

    // 沿轨道运动动画
    function shipAddDeg(cur_deg: number) {
      ship.rotation = cur_deg;
      const x = -Math.sin(cur_deg) * circle_width;
      const y = Math.cos(cur_deg) * circle_width;

      ship.x = x + root_circle.x;
      ship.y = y + root_circle.y;
      // console.log('ship.rotation', ship.rotation, cur_deg);
    }

    this.addLoop((t, dif_ms) => {
      if (this._add_ms < this._ani_ms) {
        this._add_ms += dif_ms;
        if (this._add_ms > this._ani_ms) {
          this._add_ms = this._ani_ms;
        }
      } else {
        return;
      }
      const p =
        this._pre_progress +
        this.easing(this._add_ms / this._ani_ms) * this._dif_progress;
      const diff_deg = Math.PI * 2 * p;
      // console.log('zzz',circle_width)
      // const cur_ani_deg = ship.rotation + deg_p;
      shipAddDeg(diff_deg);
    });
  }
  private _pre_progress = 0;
  private _dif_progress = 0;
  private _progress = 0;
  set progress(v: number) {
    if (isFinite(v)) {
      // v = Math.max(0, v);
      // v = Math.min(1, v);
      if (v !== this._progress) {
        this._pre_progress = this._progress;
        this._progress = v;
        this._dif_progress = v - this._pre_progress;
        this._add_ms = 0;
        this.emit("progress", v);
      }
    }
  }
  get progress() {
    return this._progress;
  }
  private _ani_ms = 500;
  private _add_ms = 0;

  resetProgress() {
    this.setProgress(0, 0);
  }
  setProgress(
    progress: number,
    ani_ms?: number,
    easing = Easing.Linear,
    immediate?: boolean,
  ) {
    if (ani_ms && isFinite(ani_ms) && ani_ms > 0) {
      this._ani_ms = ani_ms;
    }
    this.progress = progress;
    this.easing = easing;
    if (ani_ms === 0) {
      immediate = true;
    }
    if (immediate) {
      this.updateImmediate();
    }
  }
  easing = Easing.Linear;

  startPixiApp() {
    this.app && this.app.start();
  }

  stopPixiApp() {
    this.app && this.app.stop();
  }
}
