import {
  Component,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import { PromiseOut } from "../../bnqkl-framework/PromiseExtends";
import { AniBase } from "../AniBase";
import * as PIXI from "pixi.js";

export const loader = new PIXI.loaders.Loader();
export const _load_resource_promiseout = new PromiseOut<
  PIXI.loaders.ResourceDictionary
>();

export const _is_load_resource = false;
export const _coin_assets = [
  // "./assets/img/gold-coin/s36-114.png",
  // "./assets/img/gold-coin/s36-152.png",
  // "./assets/img/gold-coin/s36-177.png",
  // "./assets/img/gold-coin/s36-208.png",
  // "./assets/img/gold-coin/s36-226.png",
  // "./assets/img/gold-coin/s36-79.png",
  "./assets/img/gold-coin/s36.png",
].map((url, i) => ({
  name: "img" + i,
  url,
  info: { width: 96, height: 3456, frame_num: 36 },
}));
_coin_assets.forEach(asset => {
  loader.add(asset.name, asset.url);
});
loader.onLoad.add(() => {
  _load_resource_promiseout.resolve(loader.resources);
});
loader.onError.add(err => _load_resource_promiseout.reject(err));
loader.load();

@Component({
  selector: "fall-coins",
  templateUrl: "fall-coins.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FallCoinsComponent extends AniBase {
  @ViewChild("canvas") canvasRef!: ElementRef;

  _init() {
    this.canvasNode || (this.canvasNode = this.canvasRef.nativeElement);
    return super._init();
  }
  constructor() {
    super();
    this.on("init-start", this.initPixiApp.bind(this));
    this.on("start-animation", this.startPixiApp.bind(this));
    this.on("stop-animation", this.stopPixiApp.bind(this));
  }
  /*是否关闭动画（声音不播放了）*/
  no_animate?: boolean;
  /*是否跳过动画（依然播放声音）*/
  auto_skip_animate?: boolean;
  // loop_skip = 1;// 30fps
  // 72pt = 1英寸 = 2.54 厘米
  // 1m = 2834.645669291339 pt
  // gravity = 0.9 * this.pt(2834.645669291339); //重力加速度: px/s
  gravity = 2000; //重力加速度: px/s
  async initPixiApp() {
    if (this.app) {
      this.app.stage.children.slice().forEach(child => {
        return child.destroy();
      });
      this._loop_runs.length = 0;
      this._force_update_set.clear();
    }
    const {
      pt,
      px,
      canvasNode,
      _progress_coins_config,
      progress_coins,
      gravity,
    } = this;
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
    const resources = await _load_resource_promiseout.promise;
    // 处理resource成动画帧
    const frames_list: Array<PIXI.Texture[]> = [];
    _coin_assets.forEach(asset => {
      const resource = resources[asset.name];
      const baseTexture = new PIXI.BaseTexture(resource.data);
      const frames: PIXI.Texture[] = [];
      const u_width = asset.info.width;
      const u_height = asset.info.height / asset.info.frame_num;
      for (var i = 0; i < asset.info.frame_num; i += 1) {
        frames.push(
          new PIXI.Texture(
            baseTexture,
            new PIXI.Rectangle(0, u_height * i, u_width, u_height),
          ),
        );
      }
      frames_list.push(frames);
      // const ani = new PIXI.extras.AnimatedSprite(frames);
      // ani.animationSpeed = 1;
    });

    const { useable_lines, full_lines } = _progress_coins_config;

    const { stage, renderer, ticker } = app;
    const u_size = renderer.width / 5.5;

    const container = new PIXI.Container();
    // container.position.set(renderer.width / 2, renderer.height);
    stage.addChild(container);
    const indexContainerMap = new Map<string, PIXI.Container>();
    const getContainerByIndexAndId = (index: number, id: number) => {
      const key = index + "-" + id;
      var con = indexContainerMap.get(key);
      if (!con) {
        con = new PIXI.Container();
        con["zIndex"] = index;
        container.addChild(con);
        container.children.sort(function(a, b) {
          return b["zIndex"] - a["zIndex"];
        });
        indexContainerMap.set(key, con);
      }
      return con;
    };

    var ani_uuid_adder = 0;

    const auto_fall_down = (
      target_line_index = (Math.random() * useable_lines.length) | 0,
    ) => {
      // if (t / 200 <= progress_coins.length) {
      //   return;
      // }
      const target_line = useable_lines[target_line_index];
      if (!target_line) {
        this.removeLoop(auto_fall_down);
        return;
      }

      var speed = 0;
      const frames = frames_list[(Math.random() * frames_list.length) | 0];
      const ani = new PIXI.extras.AnimatedSprite(frames);
      this.beforeFallDown(ani);
      const ani_uuid = String(ani_uuid_adder++);
      ani.width = u_size;
      ani.height = u_size;
      // ani.animationSpeed = Math.random() + 0.5; // 金币的旋转速度
      ani.animationSpeed = 1; // 金币的旋转速度

      ani.x = target_line.x * renderer.width;
      ani.y = -u_size * 2;
      const parent = getContainerByIndexAndId(target_line.y, target_line._id);
      parent.addChild(ani);

      progress_coins.push(ani);
      /*计算出最终落点*/
      const end_y =
        renderer.height * 0.95 -
        u_size -
        (target_line.cur + target_line.y) * u_size / 5;

      /*距离*/
      const diff_y = end_y - ani.y;
      /*根据加速度与距离算出时间 a*t*t=y*2 */
      const total_time = Math.pow(diff_y * 2 / gravity, 0.5);
      /*假设每帧的时间固定*/
      const u_frame_ms = 16;
      /*可以推算出帧数，要超出终点才停止，所以多出来的一帧*/
      const ani_frame_num = Math.ceil(total_time * 1000 / u_frame_ms);
      const end_frame = 26;
      /*总帧数 36, 目标帧为24,可以算出起始的帧*/
      const start_frame = 36 - (ani_frame_num - end_frame) % 36;

      ani.gotoAndStop(start_frame);

      var _f = 0;
      var _s = null;
      // 增加下落的动画
      const coin_ani = (t, diff_time) => {
        if (this.no_animate || this.auto_skip_animate) {
          ani.gotoAndStop(end_frame);
        } else {
          ani.gotoAndStop(ani.currentFrame + 1);
        }
        // const add_speed = diff_time / 1000;
        const diff_second = u_frame_ms / 1000; //使用固定的时间，使得下落点可预测
        const add_speed = gravity * diff_second;
        const pre_speed = speed;
        speed += add_speed;
        ani.y += (pre_speed + speed) / 2 * diff_second;

        // 到达终点，停止动画，并固定这一帧的结果
        if (ani.y >= end_y || this.no_animate || this.auto_skip_animate) {
          ani.y = end_y;
          this.removeLoop(coin_ani);
          this.raf(() => this.downForceUpdate(ani_uuid));
          this.emit("end-fall-down", ani, t, this.no_animate);
          target_line.in_ani -= 1;
        }
        if (target_line.in_ani === 0) {
          parent.cacheAsBitmap = true;
        }
      };
      if (target_line.in_ani === 0) {
        parent.cacheAsBitmap = false;
      }
      target_line.in_ani += 1;
      if (this.no_animate || this.auto_skip_animate) {
        coin_ani(0, 0);
      } else {
        // 开始动画
        this.addLoop(coin_ani);
      }
      this.upForceUpdate(ani_uuid);

      target_line.cur += 1;
      if (target_line.cur >= target_line.max) {
        // console.log("完成line", target_line);
        full_lines.push(target_line);
        useable_lines.splice(useable_lines.indexOf(target_line), 1);
      }
    };
    const total = useable_lines.reduce((cur, v) => cur + v.max, 0);
    if (this._fall_down_when_progress_added) {
      this.off("progress", this._fall_down_when_progress_added);
    }
    let pre_progress_value = 0;
    this._fall_down_when_progress_added = progress => {
      const cur_progress_value = Math.round(progress * total);
      // 发生了增加，进行掉落动画
      while (cur_progress_value > pre_progress_value) {
        pre_progress_value += 1;
        auto_fall_down();
      }
      if (progress === 1) {
        this.off("progress", this._fall_down_when_progress_added);
        this._fall_down_when_progress_added = null;
      }
    };
    this.on("progress", this._fall_down_when_progress_added);

    // this._loop_runs.push(auto_fall_down);
  }
  startPixiApp() {
    this.app && this.app.start();
  }
  beforeFallDown(ani: PIXI.extras.AnimatedSprite) {}
  private _fall_down_when_progress_added: any;
  private _progress = 0;
  set progress(v: number) {
    if (isFinite(v)) {
      v = Math.max(0, v);
      v = Math.min(1, v);
      if (v !== this._progress) {
        if (v === 0) {
          // 重置
          this._progress_coins_config = this.resetProgressCoinsConfig();
          this.initPixiApp();
          this._progress = 0;
        } else {
          this.emit("progress", (this._progress = v));
        }
      }
    }
  }
  get progress() {
    return this._progress;
  }

  stopPixiApp() {
    this.app && this.app.stop();
  }

  resetProgressCoinsConfig() {
    return {
      useable_lines: [
        // 底行
        {
          y: 2.3,
          x: 0.2 * 0,
          max: 7,
        },
        {
          y: -1.1,
          x: 0.2 * 1,
          max: 9,
        },
        {
          y: -0.8,
          x: 0.2 * 2,
          max: 10,
        },
        {
          y: -1.2,
          x: 0.2 * 3,
          max: 9,
        },
        {
          y: 0.8,
          x: 0.2 * 4,
          max: 6,
        },
        // 第二行
        {
          y: 3.3,
          x: 0.2 * 0.5,
          max: 10,
        },
        {
          y: 2.8,
          x: 0.2 * 1.5,
          max: 10,
        },
        {
          y: 3.1,
          x: 0.2 * 2.5,
          max: 11,
        },
        {
          y: 4.2,
          x: 0.2 * 3.5,
          max: 9,
        },

        // 顶行
        {
          y: 7.3,
          x: 0.2 * 1.1,
          max: 10,
        },
        {
          y: 5,
          x: 0.2 * 2,
          max: 14,
        },
        {
          y: 7.1,
          x: 0.2 * 2.9,
          max: 9,
        },
      ].map((con, i) => {
        return {
          ...con,
          cur: 0,
          in_ani: 0,
          _id: i,
        };
      }) as LineOptions[],
      full_lines: [] as LineOptions[],
    };
  }
  private _progress_coins_config = this.resetProgressCoinsConfig();
  progress_coins: PIXI.extras.AnimatedSprite[] = [];
}
export type LineOptions = {
  cur: number;
  in_ani: number;
  _id: number;
  y: number;
  x: number;
  max: number;
};
