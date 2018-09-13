/*使用css的top效率最高，高于Transform*/
import {
  Component,
  ViewChild,
  ElementRef,
  Input,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CssAniBase } from "../AniBase";
import { PromiseOut } from "../../bnqkl-framework/PromiseExtends";
import { AppSettingProvider } from "../../providers/app-setting/app-setting";

const FRAMES_NUM = 51;
const miningSounds = [
  // "mining",
  "miner (1)",
  "miner (2)",
  "miner (3)",
  "miner (4)",
  "miner (5)",
];
// miningSounds.forEach(name => {
//   PIXI.sound.add(name, `assets/sounds/${name}.wav`);
// });

@Component({
  selector: "mining-person",
  templateUrl: "mining-person.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiningPersonComponent extends CssAniBase {
  @Input("auto-start") auto_start = false;
  constructor(public appSetting: AppSettingProvider) {
    super();
    this.on("init-start", this.initCssApp.bind(this));
    this.on("start-animation", this.startCssApp.bind(this));
    this.on("stop-animation", this.stopCssApp.bind(this));
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
  @ViewChild("container") containerRef!: ElementRef;

  _init() {
    this.containerNode ||
      (this.containerNode = this.containerRef.nativeElement);
    return super._init();
  }
  frames_list: HTMLImageElement[] = [];
  async initCssApp() {
    const { pt, px, containerNode, frames_list } = this;
    if (!containerNode) {
      throw new Error("call init first");
    }
    if (frames_list.length !== 0) {
      // 重新初始化
      containerNode.innerHTML = "";
      this._loop_runs.length = 0;
      frames_list.length = 0;
    }
    for (var i = 0; i < FRAMES_NUM; i += 1) {
      const i_str = ("0000" + i).substr(-4);
      const img = new Image();
      img.src = `assets/imgs/tab-vote/human-work3/_${i_str}_图层-${FRAMES_NUM -
        i}.png`;
      frames_list.push(img);
      containerNode.appendChild(img);
    }

    /// loop

    let cur_frame_i = 0;
    let pre_frame = frames_list[cur_frame_i];

    let is_saving_power_mode = this.appSetting.settings.power_saving_mode;
    this.appSetting.on(
      "changed@setting.power_saving_mode",
      is_saving => (is_saving_power_mode = is_saving)
    );

    this.addLoop(() => {
      const cur_frame = frames_list[cur_frame_i];
      const is_ani =
        !is_saving_power_mode || (cur_frame_i === 41 || cur_frame_i === 20);
      if (is_ani) {
        pre_frame.style.top = "";
        cur_frame.style.top = "0";
      }

      cur_frame_i = (cur_frame_i + 1) % frames_list.length;

      // if (cur_frame_i === 41) {
      //   PIXI.sound.play(
      //     miningSounds[(Math.random() * miningSounds.length) | 0],
      //     {
      //       loop: false,
      //       speed: 0.5,
      //       volume: 0.1,
      //     },
      //   );
      // }
      ////
      if (is_ani) {
        pre_frame = cur_frame;
      }
    });
  }
  startCssApp() {
    this.app && this.app.start();
  }

  stopCssApp() {
    this.app && this.app.stop();
  }
}
