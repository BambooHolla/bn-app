import { EventEmitter } from "eventemitter3";
import * as PIXI from "pixi.js";
// PIXI.settings.TARGET_FPMS = 0.03;
// const _raf = requestAnimationFrame;
// window["requestAnimationFrame"] = cb => _raf(() => _raf(cb));
export class AniBase extends EventEmitter {
  cname = this.constructor.name;
  _app?: PIXI.Application;
  get app() {
    return this._app;
  }
  set app(v: PIXI.Application | undefined) {
    this._app = v;
    if (v) {
      v.ticker["force_update"] = this.force_update;
    }
  }
  constructor() {
    super();
    window["ani_" + this.cname] = this;
    this._loop = this._loop.bind(this);
  }
  ngAfterViewInit() {
    this.once("init-start", () => {
      this.startAnimation();
    });
    this._init();
  }
  ngOnDestroy() {
    this.stopAnimation();
    this.removeAllListeners();
  }
  devicePixelRatio = window.devicePixelRatio;
  pt = px => this.devicePixelRatio * px;
  px = pt => pt / this.devicePixelRatio;
  is_started = false;
  startAnimation() {
    if (this.is_started) {
      return;
    }

    this.is_started = true;
    console.group("start-animation:" + this.cname);
    this.emit("start-animation");
    console.groupEnd();
    requestAnimationFrame(t => {
      this.pre_t = t;
      this._loop(t);
    });
  }
  stopAnimation() {
    this.is_started = false;
    console.group("stop-animation:" + this.cname);
    this.emit("stop-animation");
    console.groupEnd();
  }
  canvasNode?: HTMLCanvasElement;
  is_inited = false;
  _init() {
    // 重新初始化
    this._loop_runs.length = 0;
    if (
      !(
        this.canvasNode &&
        this.canvasNode.clientHeight &&
        this.canvasNode.clientWidth
      )
    ) {
      requestAnimationFrame(() => this._init());
      return false;
    }
    console.group("init-start");
    this.emit("init-start", this.canvasNode);
    console.groupEnd();
    this.is_inited = true;
    return true;
  }
  pre_t;
  _loop_runs: Function[] = [];
  _loop(t) {
    const diff_t = t - this.pre_t;
    this.pre_t = t;
    this._update(t, diff_t);
    if (this.is_started) requestAnimationFrame(this._loop);
  }
  /**在省电模式下是否依旧强制运行*/
  _force_update = false;
  set force_update(v: boolean) {
    if (this._force_update != v) {
      this._force_update = v;
      if (this.app) {
        this.app.ticker["force_update"] = v;
      }
    }
  }
  get force_update() {
    return this._force_update;
  }
  private _force_update_set = new Set<string | number>();
  upForceUpdate(key: string | number) {
    const { _force_update_set } = this;
    _force_update_set.add(key);
    this.force_update = !!_force_update_set.size;
  }
  downForceUpdate(key: string | number) {
    const { _force_update_set } = this;
    _force_update_set.delete(key);
    this.force_update = !!_force_update_set.size;
  }
  /**是否处于省电模式*/
  static power_saving_mode = false;
  forceRenderOneFrame() {
    this.force_update = true;
    cancelAnimationFrame(this["__UPDATER_ID__"]);
    this["__UPDATER_ID__"] = requestAnimationFrame(
      () => (this.force_update = false),
    );
  }
  _update(t, diff_t) {
    if (this.loop_skip) {
      if (this._cur_loop_skip < this.loop_skip) {
        this._cur_loop_skip += 1;
        return;
      }
      this._cur_loop_skip = 0;
    }
    for (let fun of this._loop_runs) {
      fun(t, diff_t);
    }
  }
  updateImmediate() {
    const t = performance.now();
    const diff_t = t - this.pre_t;
    this.pre_t = t;
    this._update(t, diff_t);
  }
  removeLoop(cb: Function) {
    const index = this._loop_runs.indexOf(cb);
    if (index !== -1) {
      this._loop_runs.splice(index, 1);
    }
  }
  addLoop(cb: Function) {
    this._loop_runs.push(cb);
  }
  static OnInit(target, name) {
    target.on("init-start", () => {
      target[name]();
    });
  }
  static OnStart(target, name) {
    target.on("start-animation", () => {
      target[name]();
    });
  }
  static OnStop(target, name) {
    target.on("stop-animation", () => {
      target[name]();
    });
  }
  loop_skip = 0;
  private _cur_loop_skip = 0;

  static animateNumber(
    from: number,
    to: number,
    duration: number,
    easing_function = Easing.Linear,
  ) {
    const diff = to - from;
    return function(
      cb: (v: number) => void | boolean,
      after_finished?: () => void,
    ) {
      const start_time = performance.now();
      const ani = () => {
        const cur_time = performance.now();
        const progress = Math.min((cur_time - start_time) / duration, 1);
        const v = from + diff * easing_function(progress);
        const res = cb(v);
        if (progress !== 1) {
          if (res !== false) {
            requestAnimationFrame(ani);
          }
        } else {
          after_finished && after_finished();
        }
      };
      ani();
    };
  }
  static numberToColor(color_number: number) {
    return AniBase.stringToColor(color_number.toString(16));
  }
  static stringToColor(color_string: string) {
    return color_string
      .split(/(..)/g)
      .filter(v => v)
      .map(v => parseInt(v, 16));
  }
  static toColor(color: number | string) {
    if (typeof color === "number") {
      return AniBase.numberToColor(color);
    }
    return AniBase.stringToColor(color);
  }
  static animateColor(
    from: number | string,
    to: number | string,
    duration: number,
    easing_function = Easing.Linear,
  ) {
    const from_color = AniBase.toColor(from);
    const to_color = AniBase.toColor(to);
    const diff_color = from_color.map((from_v, i) => to_color[i] - from_v);
    return (
      cb: (v: number[]) => void | boolean,
      after_finished?: () => void,
    ) => {
      AniBase.animateNumber(0, 1, duration, easing_function)(p => {
        const cur_color = from_color.map(
          (from_v, i) => (from_v + diff_color[i] * p) | 0,
        );
        return cb(cur_color);
      }, after_finished);
    };
  }
  Easing = Easing;
}

export const Easing = {
  Linear(k: number) {
    return k;
  },
  Quadratic_In(k: number) {
    return k * k;
  },
  Quadratic_Out(k: number) {
    return k * (2 - k);
  },
  Quadratic_InOut(k: number) {
    if ((k *= 2) < 1) {
      return 0.5 * k * k;
    }
    return -0.5 * (--k * (k - 2) - 1);
  },
  Cubic_In(k: number) {
    return k * k * k;
  },
  Cubic_Out(k: number) {
    return --k * k * k + 1;
  },
  Cubic_InOut(k: number) {
    if ((k *= 2) < 1) {
      return 0.5 * k * k * k;
    }
    return 0.5 * ((k -= 2) * k * k + 2);
  },
  Quartic_In(k: number) {
    return k * k * k * k;
  },
  Quartic_Out(k: number) {
    return 1 - --k * k * k * k;
  },
  Quartic_InOut(k: number) {
    if ((k *= 2) < 1) {
      return 0.5 * k * k * k * k;
    }
    return -0.5 * ((k -= 2) * k * k * k - 2);
  },
  Quintic_In(k: number) {
    return k * k * k * k * k;
  },
  Quintic_Out(k: number) {
    return --k * k * k * k * k + 1;
  },
  Quintic_InOut(k: number) {
    if ((k *= 2) < 1) {
      return 0.5 * k * k * k * k * k;
    }
    return 0.5 * ((k -= 2) * k * k * k * k + 2);
  },
  Sinusoidal_In(k: number) {
    return 1 - Math.cos(k * Math.PI / 2);
  },
  Sinusoidal_Out(k: number) {
    return Math.sin(k * Math.PI / 2);
  },
  Sinusoidal_InOut(k: number) {
    return 0.5 * (1 - Math.cos(Math.PI * k));
  },
  Exponential_In(k: number) {
    return k === 0 ? 0 : Math.pow(1024, k - 1);
  },
  Exponential_Out(k: number) {
    return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
  },
  Exponential_InOut(k: number) {
    if (k === 0) {
      return 0;
    }
    if (k === 1) {
      return 1;
    }
    if ((k *= 2) < 1) {
      return 0.5 * Math.pow(1024, k - 1);
    }
    return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2);
  },
  Circular_In(k: number) {
    return 1 - Math.sqrt(1 - k * k);
  },
  Circular_Out(k: number) {
    return Math.sqrt(1 - --k * k);
  },
  Circular_InOut(k: number) {
    if ((k *= 2) < 1) {
      return -0.5 * (Math.sqrt(1 - k * k) - 1);
    }
    return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
  },
  Elastic_In(k: number) {
    var s;
    var a = 0.1;
    var p = 0.4;
    if (k === 0) {
      return 0;
    }
    if (k === 1) {
      return 1;
    }
    if (!a || a < 1) {
      a = 1;
      s = p / 4;
    } else {
      s = p * Math.asin(1 / a) / (2 * Math.PI);
    }
    return -(
      a *
      Math.pow(2, 10 * (k -= 1)) *
      Math.sin((k - s) * (2 * Math.PI) / p)
    );
  },
  Elastic_Out(k: number) {
    var s;
    var a = 0.1;
    var p = 0.4;
    if (k === 0) {
      return 0;
    }
    if (k === 1) {
      return 1;
    }
    if (!a || a < 1) {
      a = 1;
      s = p / 4;
    } else {
      s = p * Math.asin(1 / a) / (2 * Math.PI);
    }
    return a * Math.pow(2, -10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1;
  },
  Elastic_InOut(k: number) {
    var s;
    var a = 0.1;
    var p = 0.4;
    if (k === 0) {
      return 0;
    }
    if (k === 1) {
      return 1;
    }
    if (!a || a < 1) {
      a = 1;
      s = p / 4;
    } else {
      s = p * Math.asin(1 / a) / (2 * Math.PI);
    }
    if ((k *= 2) < 1) {
      return (
        -0.5 *
        (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p))
      );
    }
    return (
      a *
        Math.pow(2, -10 * (k -= 1)) *
        Math.sin((k - s) * (2 * Math.PI) / p) *
        0.5 +
      1
    );
  },
  Back_In(k: number) {
    var s = 1.70158;
    return k * k * ((s + 1) * k - s);
  },
  Back_Out(k: number) {
    var s = 1.70158;
    return --k * k * ((s + 1) * k + s) + 1;
  },
  Back_InOut(k: number) {
    var s = 1.70158 * 1.525;
    if ((k *= 2) < 1) {
      return 0.5 * (k * k * ((s + 1) * k - s));
    }
    return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
  },
  Bounce_In(k: number) {
    return 1 - Easing.Bounce_Out(1 - k);
  },
  Bounce_Out(k: number) {
    if (k < 1 / 2.75) {
      return 7.5625 * k * k;
    } else if (k < 2 / 2.75) {
      return 7.5625 * (k -= 1.5 / 2.75) * k + 0.75;
    } else if (k < 2.5 / 2.75) {
      return 7.5625 * (k -= 2.25 / 2.75) * k + 0.9375;
    } else {
      return 7.5625 * (k -= 2.625 / 2.75) * k + 0.984375;
    }
  },
  Bounce_InOut(k: number) {
    if (k < 0.5) {
      return Easing.Bounce_In(k * 2) * 0.5;
    }
    return Easing.Bounce_Out(k * 2 - 1) * 0.5 + 0.5;
  },
};
