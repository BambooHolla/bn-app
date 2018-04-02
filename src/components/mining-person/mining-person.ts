import { Component, ViewChild, ElementRef, Input } from "@angular/core";
import { AniBase } from "../AniBase";
import { PromiseOut } from "../../bnqkl-framework/PromiseExtends";
import * as PIXI_SOUND from "pixi-sound";
console.log("PIXI_SOUND", PIXI_SOUND);
// debugger
export const loader = new PIXI.loaders.Loader();
export const _load_resource_promiseout = new PromiseOut<
  PIXI.loaders.ResourceDictionary
>();
export const FRAMES_NUM = 51;
export const frames_list: PIXI.Texture[] = [];
for (let i = 0; i < FRAMES_NUM; i += 1) {
  const i_str = ("0000" + i).substr(-4);
  loader.add(
    "img" + i_str,
    `assets/imgs/tab-vote/human-work3/_${i_str}_图层-${FRAMES_NUM - i}.png`,
  );
}
PIXI.sound.add("miningSound", "assets/sounds/mining.wav");
loader.onError.add(err => {
  _load_resource_promiseout.reject(err);
});
loader.load((loader, resources) => {
  for (let i = 0; i < FRAMES_NUM; i += 1) {
    const i_str = ("0000" + i).substr(-4);
    const resource = resources["img" + i_str] as PIXI.loaders.Resource;
    frames_list.unshift(resource.texture);
  }
  _load_resource_promiseout.resolve(resources);
});

@Component({
  selector: "mining-person",
  templateUrl: "mining-person.html",
})
export class MiningPersonComponent extends AniBase {
  @Input("auto-start") auto_start = false;
  constructor() {
    super();
    this.on("init-start", this.initPixiApp.bind(this));
    this.on("start-animation", this.startPixiApp.bind(this));
    this.on("stop-animation", this.stopPixiApp.bind(this));
    this.force_update = true;
    this.loop_skip = 1; //30fps
  }
  only_play_sound = false;
  startAnimation() {
    this.only_play_sound = false;
    super.startAnimation();
  }
  stopAnimation(only_play_sound?: boolean) {
    // 只播放声音，后台运行模式
    this.only_play_sound = !!only_play_sound;
    if (!this.only_play_sound) {
      super.stopAnimation();
    }
  }
  @ViewChild("canvas") canvasRef!: ElementRef;

  _init() {
    this.canvasNode || (this.canvasNode = this.canvasRef.nativeElement);
    return super._init();
  }
  async initPixiApp() {
    if (this.app) {
      this.app.stage.children.slice().forEach(child => {
        return child.destroy();
      });
      this._loop_runs.length = 0;
    }
    const { pt, px, canvasNode } = this;
    if (!canvasNode) {
      throw new Error("call init first");
    }
    if (!this.app) {
      this.app = new PIXI.Application({
        antialias: true,
        transparent: true,
        view: canvasNode,
        height: pt(canvasNode.clientHeight),
        width: pt(canvasNode.clientWidth),
        autoStart: this.auto_start,
      });
    }
    const app = this.app;
    const resources = await _load_resource_promiseout.promise;
    console.log("MiningPersonComponent resources", resources);

    const { stage, renderer, ticker } = app;
    const { width: W, height: H } = renderer;
    const wh_max_size = Math.max(W, H);
    const wh_rate = W / H;

    let cur_frame_i = 0;
    const mc = new PIXI.Sprite(frames_list[cur_frame_i]);
    const mc_wh_rate = mc.width / mc.height;
    if (mc_wh_rate === wh_rate) {
      mc.width = W;
      mc.height = H;
    } else if (wh_rate > mc_wh_rate) {
      //render的宽比较大，采用height
      mc.height = H;
      mc.width = mc_wh_rate * H;
      canvasNode.style.width = "auto";
    } else {
      mc.width = W;
      mc.height = W / mc_wh_rate;
      canvasNode.style.height = "auto";
    }
    if (mc.width > mc.height) {
      if (mc.width > wh_max_size) {
        mc.width = wh_max_size;
        mc.height = wh_max_size / mc_wh_rate;
      }
    } else {
      if (mc.height > wh_max_size) {
        mc.height = wh_max_size;
        mc.width = wh_max_size * mc_wh_rate;
      }
    }
    // 重新改变大小，以最节省的画布大小的模式进行绘制
    renderer.resize(mc.width, mc.height);

    this.addLoop(() => {
      cur_frame_i = (cur_frame_i + 1) % FRAMES_NUM;
      if (!this.only_play_sound) {
        mc.texture = frames_list[cur_frame_i];
      }
      if (cur_frame_i === 41) {
        PIXI.sound.play("miningSound", {
          loop: false,
          speed: 0.5,
        });
      }
    });
    stage.addChild(mc);
  }
  startPixiApp() {
    this.app && this.app.start();
  }

  stopPixiApp() {
    this.app && this.app.stop();
  }
}
