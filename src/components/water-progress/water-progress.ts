import {
  Component,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  Input,
} from "@angular/core";
import { AniBase } from "../AniBase";
import * as PIXI from "pixi.js";
import { SimplexNoise } from "../simpleNoise";

@Component({
  selector: "water-progress",
  templateUrl: "water-progress.html",
})
export class WaterProgressComponent extends AniBase {
  noise = new SimplexNoise();
  @ViewChild("canvas") canvasRef!: ElementRef;

  constructor() {
    super();
    this.on("init-start", this.initPixiApp.bind(this));
    this.on("start-animation", this.startPixiApp.bind(this));
    this.on("stop-animation", this.stopPixiApp.bind(this));
    this.force_update = true;
  }

  _init() {
    this.canvasNode ||
      (this.canvasNode = this.canvasRef.nativeElement as HTMLCanvasElement);
    return super._init();
  }
  _progress = 0.5;
  _progress_text = "50%";
  @Input("progress")
  get progress() {
    return this._progress;
  }
  set progress(v: number) {
    this._progress = v;
    if (isNaN(this._progress)) {
      this._progress = 0;
    } else if (this._progress > 1) {
      this._progress %= 1;
      if (this._progress === 0) {
        this._progress = 1;
      }
    } else if (this._progress < 0) {
      this._progress = this._progress % 1 + 1;
      if (this._progress === 0) {
        this._progress = 1;
      }
    }
  }
  _text?: string;
  @Input("text")
  get text() {
    if (!this.is_show_progress_ani && typeof this._text === "string") {
      return this._text;
    }
    return (
      this.progress_prev_text + this._progress_text + this.progress_next_text
    );
  }
  set text(v: string) {
    this._text = v;
    // 快速渲染模式，不进行强行渲染
    if (this.loop_skip !== 0) {
      this._renderText();
    }
  }
  private _bg_text?: PIXI.Text;
  private _text_fontend?: PIXI.Text;
  private _textRenderParams = { W: 0, H: 0 };
  private _renderText() {
    const { text } = this;
    const { W, H } = this._textRenderParams;
    for (let pixi_text of [this._bg_text, this._text_fontend]) {
      if (pixi_text && pixi_text.text !== text) {
        pixi_text.text = text;
        pixi_text.x = W / 2 - pixi_text.width / 2;
        pixi_text.y = H / 2 - pixi_text.height / 2;
      }
    }
    this._bg_text && (this._bg_text.style.fill = this.lines[0].color);
  }

  @Input("lines")
  lines = [
    { color: 0x51d0f0, alpha: 0.8 }, // "rgba(81,208,240, 0.8)",
    { color: 0x60ebe3, alpha: 0.8 }, //"rgba(96,235,227, 0.8)",
    { color: 0x90f7f1, alpha: 0.4 }, //"rgba(144,247,241, 0.4)"
  ];

  private __ani_progress = 0;
  private get _ani_progress() {
    return this.__ani_progress;
  }
  private set _ani_progress(v: number) {
    if (v !== this.__ani_progress) {
      this.__ani_progress = v;
      this._progress_text = this.progressFormatter(this.__ani_progress);
    }
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
      this.app = new PIXI.Application({
        view: canvasNode,
        width: pt(canvasNode.clientWidth),
        height: pt(canvasNode.clientHeight),
        transparent: false,
        antialias: true,
        autoStart: this.auto_start,
        backgroundColor: 0xffffff,
      });
    }
    const app = this.app;
    const { renderer, stage } = this.app;
    const { width: W, height: H } = renderer;
    const ctx = new PIXI.Graphics();
    const ctx_text_mask = ctx.clone();
    const text_gen = fill => {
      const text = new PIXI.Text("", {
        fontSize: pt(20),
        fill,
        align: "center",
      });
      stage.addChild(text);
      return text;
    };
    // const bg_text_cover = new PIXI.Graphics();
    // bg_text_cover.beginFill(0xffffff, 0);
    // bg_text_cover.drawRect(0, 0, W, H);
    // bg_text_cover.endFill();
    // stage.addChild(bg_text_cover);

    const bg_text = (this._bg_text = text_gen(0x51d0f0));

    stage.addChild(ctx);
    const text_fontend = (this._text_fontend = text_gen(0xffffff));

    // 配置字体渲染的参数
    this._textRenderParams = { W, H };

    this.stopProgressAni();
    let _step = 0;
    let _pre_progress: number;
    this.addLoop(t => {
      const { lines, progress } = this;
      const diff_progress = progress - this._ani_progress;
      const diff_progress_abs = Math.abs(diff_progress);
      if (diff_progress_abs < 0.02) {
        this._ani_progress = progress;
        this.stopProgressAni();
      } else {
        this.startProgressAni();
        if (diff_progress_abs < 0.1) {
          this._ani_progress += diff_progress < 0 ? -0.02 : 0.02;
        } else {
          this._ani_progress += (progress - this._ani_progress) / 5;
        }
      }
      const wave_height = H / 10;
      const base_height = H * (1 - this._ani_progress) - wave_height / 2;
      _step += 0.01;
      ctx.clear();
      //画3个不同颜色的矩形
      for (var j = lines.length - 1; j >= 0; j--) {
        //每个矩形的角度都不同
        var angle = (_step * 10 + j * 15) * Math.PI / 180;

        const reversed_list = Array.from({ length: 4 }, (_, i) => {
          return this.noise.noise2D(j, _step + i);
        });
        const getY = (xv: number, v: number) => {
          return (
            (v * 0.3 +
              Math.sin(
                (_step * (j + 1) / lines.length + xv + j * 2) * Math.PI * 2,
              ) *
                0.7) *
              wave_height +
            base_height
          );
        };
        // ctx.beginPath();
        // ctx.fillStyle = lines[j];
        const line_style = lines[j];
        ctx.beginFill(line_style.color, line_style.alpha);
        let next_x, next_y;
        let len = reversed_list.length - 1;

        for (let i = -1; i < len; i += 1) {
          const x = next_x;
          const y = next_y;
          const xv = (i + 1) / len;
          next_x = xv * W;
          next_y = getY(xv, reversed_list[i + 1]);
          if (i === 0) {
            ctx.moveTo(x, y);
          } else if (i > 0) {
            ctx.quadraticCurveTo(x, y, (x + next_x) / 2, (y + next_y) / 2);
          }
        }
        ctx.quadraticCurveTo(next_x, next_y, (len + 1) / len * W, base_height);
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.endFill();
      }
      const ctx_text_mask1 = ctx.clone();
      /*bg_text_cover.mask = */ text_fontend.mask = ctx_text_mask1;

      ///
      this._renderText();
    });
    this.forceRenderOneFrame();
  }
  @Input("auto-start") auto_start = false;
  @Input("progress-prev-text") progress_prev_text = "";
  @Input("progress-next-text") progress_next_text = "";
  @Input("ani-progress") is_show_progress_ani = false;
  progressFormatter(v: number) {
    return (v * 100).toFixed(0) + "%";
  }
  default_loop_skip = 2;
  startProgressAni() {
    this.loop_skip = 0;
  }
  stopProgressAni() {
    this.loop_skip = this.default_loop_skip;
  }
  startPixiApp() {
    this.app && this.app.start();
  }

  stopPixiApp() {
    this.app && this.app.stop();
  }
}
