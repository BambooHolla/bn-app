import {
  Component,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import { AniBase } from "../AniBase";
import { ChainMeshComponent } from "../chain-mesh/chain-mesh";
import * as PIXI from "pixi.js";
@Component({
  selector: "buddha-glow",
  templateUrl: "buddha-glow.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuddhaGlowComponent extends AniBase {
  // noise = new SimplexNoise();
  @ViewChild("canvas") canvasRef!: ElementRef;

  constructor() {
    super();
    this.on("init-start", this.initPixiApp.bind(this));
    this.on("start-animation", this.startPixiApp.bind(this));
    this.on("stop-animation", this.stopPixiApp.bind(this));
  }
  _init() {
    this.canvasNode || (this.canvasNode = this.canvasRef.nativeElement);
    return super._init();
  }
  pt = px => px;
  private initPixiApp() {
    if (this.app) {
      this.app.stage.children.slice().forEach(child => {
        return child.destroy();
      });
      this._loop_runs.length = 0;
    }
    const { pt, px, canvasNode, lights } = this;
    if (!canvasNode) {
      throw new Error("call init first");
    }
    if (!this.app) {
      this.app = new PIXI.Application({
        antialias: true,
        transparent: true,
        // backgroundColor: 0xebbb57,
        view: canvasNode,
        height: pt(canvasNode.clientHeight),
        width: pt(canvasNode.clientWidth),
      });
    }
    const app = this.app;
    const { stage, renderer, ticker } = app;

    const lightsContainer = new PIXI.Container();

    lightsContainer.x = renderer.width / 2;
    lightsContainer.y = renderer.height * 0.1;

    stage.addChild(lightsContainer);

    // now create some items and randomly position them in the stuff container
    // const colors = [0xffd246, 0xffffff];
    const colors = [
      0xffd246,
      0xffdf00,
      0xffd800,
      0xffee75,
      0xef9b0f,
      0xffba00,
      0xfff77d,
      0xfffacd,
      0xffbf00,
    ];
    const gradientTexture_list: PIXI.Texture[] = [];
    colors.forEach(color_num => {
      gradientTexture_list.push(
        BuddhaGlowComponent.getRadialGradientTexture(color_num),
      );
      gradientTexture_list.push(
        BuddhaGlowComponent.getLinearGradientTexture(color_num),
      );
    });
    const wh_size = Math.min(renderer.width, renderer.height);
    const circle_mesh_canvas = ChainMeshComponent.createRadialGradient(
      renderer.width,
      [
        [0, "rgba(255,255,255,1)"],
        [0.8, "rgba(255,255,255,1)"],
        [0.95, "rgba(255,255,255,0)"],
        [1, "rgba(255,255,255,0)"],
      ],
    );
    document.body.appendChild(circle_mesh_canvas);
    const circle_mesh_texture = PIXI.Texture.fromCanvas(circle_mesh_canvas);
    const circle_mesh_mask = new PIXI.Sprite(circle_mesh_texture);
    stage.addChild(circle_mesh_mask);
    stage.mask = circle_mesh_mask;

    const getDeg = p => {
      return Math.PI * 2 * (Math.abs(p - 0.5) * 1 - 0.25);
    };
    const num1 = 200;
    const baseLightContainer = new PIXI.Container();
    lightsContainer.addChild(baseLightContainer);
    for (let i = 0; i < num1; i++) {
      const sp = new PIXI.Sprite(
        gradientTexture_list[i % gradientTexture_list.length],
      );
      const progress = i / (num1 - 1);

      sp.width = (Math.random() + 0.3) * pt(12);
      sp.height = sp.height * 2; // * (Math.random() / 4 + 2);

      sp.blendMode = PIXI.BLEND_MODES.SCREEN;
      sp.rotation = progress * Math.PI * 2;
      sp.anchor.set(0.5, 0);

      baseLightContainer.addChild(sp);
      lights.push(sp);
    }
    baseLightContainer.cacheAsBitmap = true;
    const num2 = 100;
    const dynLightContainer = new PIXI.Container();
    lightsContainer.addChild(dynLightContainer);
    for (let i = 0; i < num2; i++) {
      const sp = new PIXI.Sprite(
        gradientTexture_list[i % gradientTexture_list.length],
      );
      const progress = i / (num2 - 1);

      sp.width = (Math.random() + 0.3) * pt(8);
      sp.height = sp.height * 2; // * (Math.random() / 4 + 2);
      // if (Math.random() > 0.5) {
      //   sp.blendMode = PIXI.BLEND_MODES.SCREEN;
      // } else {
      sp.blendMode = PIXI.BLEND_MODES.ADD;
      // }
      sp.rotation = getDeg(progress);
      sp.anchor.set(0.5, 0);

      dynLightContainer.addChild(sp);
      lights.push(sp);

      let _p = progress;
      let _i_y = 0;

      let _p_speed = Math.random() * 0.0006;
      this._loop_runs.push(() => {
        _i_y += 0.0005;

        // _p = Math.abs(noise.noise2D(i, _i_y));
        _p = _p + _p_speed;
        if (_p > 1) {
          _p -= 1;
          // 重置速度
          _p_speed = Math.random() * 0.0006;
        }
        sp.alpha = (Math.sin(_p * Math.PI * 20) + 1) / 2;
        sp.rotation = getDeg(_p);
      });
    }
  }
  loop_skip = 2; // 跳2帧，20fps
  lights: PIXI.Sprite[] = [];
  static createLinearGradient(
    x1 = 300,
    y1 = 0,
    stops = [[0, "#FFF"], [1, "#000"]],
  ) {
    var canvas = document.createElement("canvas");
    const size = Math.max(x1, y1);
    const min = Math.min(x1, y1);
    if (x1 < y1) {
      canvas.height = size;
      canvas.width = min || 1;
    } else {
      canvas.width = size;
      canvas.height = min || 1;
    }

    var ctx = canvas.getContext("2d");
    if (ctx) {
      var gradient = ctx.createLinearGradient(0, 0, x1, y1);
      for (let stop of stops) {
        gradient.addColorStop(stop[0] as number, stop[1] as string);
      }
      ctx.fillStyle = gradient;

      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    return canvas;
  }
  static createRadialGradient(r = 300, stops = [[0, "#FFF"], [1, "#000"]]) {
    var canvas = document.createElement("canvas");

    canvas.height = r;
    canvas.width = r;

    const half_r = r / 2;

    var ctx = canvas.getContext("2d");
    if (ctx) {
      var gradient = ctx.createRadialGradient(half_r, 0, half_r, half_r, 0, 0);
      for (let stop of stops) {
        gradient.addColorStop(stop[0] as number, stop[1] as string);
      }
      ctx.fillStyle = gradient;

      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    return canvas;
  }
  startPixiApp() {
    this.app && this.app.start();
  }

  stopPixiApp() {
    this.app && this.app.stop();
  }
  static radialGradientCacheMap = new Map<number, PIXI.Texture>();
  static getRadialGradientTexture(color_num: number) {
    const cache = BuddhaGlowComponent.radialGradientCacheMap.get(color_num);
    if (cache) {
      return cache;
    }
    const RGB = color_num
      .toString(16)
      .split(/(..)/g)
      .filter(v => v)
      .map(v => parseInt(v, 16));
    const gradient_r_canvas = BuddhaGlowComponent.createRadialGradient(
      window.innerWidth,
      [[1, `rgba(${RGB},1)`], [0, `rgba(${RGB},0)`]],
    );

    const texture = PIXI.Texture.fromCanvas(gradient_r_canvas);

    BuddhaGlowComponent.radialGradientCacheMap.set(color_num, texture);
    return texture;
  }
  static linearGradientCacheMap = new Map<number, PIXI.Texture>();
  static getLinearGradientTexture(color_num: number) {
    const cache = BuddhaGlowComponent.linearGradientCacheMap.get(color_num);
    if (cache) {
      return cache;
    }
    const RGB = color_num
      .toString(16)
      .split(/(..)/g)
      .filter(v => v)
      .map(v => parseInt(v, 16));

    const gradient_l_canvas = BuddhaGlowComponent.createLinearGradient(
      0,
      window.innerWidth,
      [[0, `rgba(${RGB},1)`], [1, `rgba(${RGB},0)`]],
    );

    const texture = PIXI.Texture.fromCanvas(gradient_l_canvas);

    BuddhaGlowComponent.linearGradientCacheMap.set(color_num, texture);
    return texture;
  }
}
const colors = [
  0xffd246,
  0xffdf00,
  0xffd800,
  0xffee75,
  0xef9b0f,
  0xffba00,
  0xfff77d,
  0xfffacd,
  0xffbf00,
];
colors.forEach(color_num => {
  BuddhaGlowComponent.getRadialGradientTexture(color_num);
  BuddhaGlowComponent.getLinearGradientTexture(color_num);
});
