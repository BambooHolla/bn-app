import EventEmitter from "eventemitter3";
import * as PIXI from "pixi.js";
import { afCtrl, tryRegisterGlobal } from "../bnqkl-framework/helper";
import * as FontFaceObserver from "fontfaceobserver";
export const ifmicon_font_ready = new FontFaceObserver("ifmicon").load();

function _tick(time) {
  this._requestId = null;

  if (this.started) {
    // Invoke listeners now
    this.update(time);
    // Listener side effects may have modified ticker state.
    if (this.started && this._requestId === null && this._head.next) {
      this._requestId = afCtrl.raf(() => this._tick());
    }
  }
}
PIXI.ticker.shared["_tick"] = _tick;
PIXI.ticker.Ticker.prototype["_requestIfNeeded"] = function _requestIfNeeded() {
  if (this._requestId === null && this._head.next) {
    // ensure callbacks get correct delta
    this.lastTime = performance.now();
    this._requestId = afCtrl.raf(() => this._tick());
  }
};
PIXI.ticker.Ticker.prototype["_cancelIfNeeded"] = function _cancelIfNeeded() {
  if (this._requestId !== null) {
    afCtrl.caf(this._requestId);
    this._requestId = null;
  }
};
// PIXI.settings.TARGET_FPMS = 0.03;

export class AniBase extends EventEmitter {
  cname = this.constructor.name;
  _app?: PIXI.Application;
  get app() {
    return this._app;
  }
  static PIXIAppbuilder(options?: PIXI.ApplicationOptions) {
    const app = new PIXI.Application(options);
    app.ticker["_tick"] = _tick;
    return app;
  }
  PIXIAppbuilder = AniBase.PIXIAppbuilder;
  set app(v: PIXI.Application | undefined) {
    this._app = v;
    if (v) {
      v.ticker["force_update"] = this.force_update;
    }
  }
  constructor() {
    super();
    tryRegisterGlobal("ani_" + this.cname, this);
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
    const { app } = this;
    if (app) {
      app.destroy();
    }
    this.app = undefined;
  }
  devicePixelRatio = window.devicePixelRatio;
  pt = px => this.devicePixelRatio * px;
  px = pt => pt / this.devicePixelRatio;
  static raf: typeof afCtrl.raf = afCtrl.raf.bind(afCtrl);
  raf = AniBase.raf;
  static caf: typeof afCtrl.caf = afCtrl.caf.bind(afCtrl);
  caf = AniBase.caf;
  is_started = false;
  startAnimation() {
    if (this.is_started) {
      return;
    }

    this.is_started = true;
    console.group("start-animation:" + this.cname);
    this.emit("start-animation");
    console.groupEnd();
    this.raf(t => {
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
      this.raf(() => this._init());
      return false;
    }
    console.group("init-start", this.cname);
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
    if (this.is_started) this.raf(this._loop);
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
  protected _force_update_set = new Set<string>();
  upForceUpdate(key: string) {
    const { _force_update_set } = this;
    _force_update_set.add(key);
    this.force_update = !!_force_update_set.size;
  }
  downForceUpdate(key: string) {
    const { _force_update_set } = this;
    _force_update_set.delete(key);
    this.force_update = !!_force_update_set.size;
  }
  /**是否处于省电模式*/
  static power_saving_mode = false;
  __UPDATER_ID__: null | number = null;
  forceRenderOneFrame() {
    if (this.force_update) {
      return;
    }
    this.force_update = true;
    this.__UPDATER_ID__ !== null && this.caf(this.__UPDATER_ID__);
    this.__UPDATER_ID__ = this.raf(() => {
      this.force_update = false;
      this.__UPDATER_ID__ = null;
    });
  }
  _update(t, diff_t) {
    if (this.loop_skip) {
      if (this._cur_loop_skip < this.loop_skip) {
        this._cur_loop_skip += 1;
        return;
      }
      this._cur_loop_skip = 0;
    }
    for (var fun of this._loop_runs) {
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
  static createLinearGradient(
    x1 = 300,
    y1 = 0,
    stops = [[0, "#FFF"], [1, "#000"]]
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
      stops.forEach(stop => {
        gradient.addColorStop(stop[0] as number, stop[1] as string);
      });
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
      stops.forEach(stop => {
        gradient.addColorStop(stop[0] as number, stop[1] as string);
      });
      ctx.fillStyle = gradient;

      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    return canvas;
  }
  static animateNumber(
    from: number,
    to: number,
    duration: number,
    easing_function = Easing.Linear
  ) {
    const diff = to - from;
    let frame_id;
    const abort = () => {
      this.caf(frame_id);
    };
    return (
      cb: (v: number, abort: () => void) => void | boolean,
      after_finished?: () => void
    ) => {
      const start_time = performance.now();
      const ani = () => {
        const cur_time = performance.now();
        const progress = Math.min((cur_time - start_time) / duration, 1);
        const v = from + diff * easing_function(progress);
        const res = cb(v, abort);
        if (progress !== 1) {
          if (res !== false) {
            frame_id = this.raf(ani);
          }
        } else {
          after_finished && after_finished();
        }
      };
      ani();
    };
  }
  static numberToColor(color_number: number) {
    const v0 = color_number >> 16;
    const v1 = (color_number - (v0 << 16)) >> 8;
    const v2 = color_number - (v0 << 16) - (v1 << 8);
    return [v0, v1, v2];
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
    easing_function = Easing.Linear
  ) {
    const from_color = AniBase.toColor(from);
    const to_color = AniBase.toColor(to);
    const diff_color = from_color.map((from_v, i) => to_color[i] - from_v);
    return (
      cb: (v: number[], abort: () => void) => void | boolean,
      after_finished?: () => void
    ) => {
      AniBase.animateNumber(0, 1, duration, easing_function)((p, abort) => {
        const cur_color = from_color.map(
          (from_v, i) => (from_v + diff_color[i] * p) | 0
        );
        return cb(cur_color, abort);
      }, after_finished);
    };
  }
  Easing = Easing;
  static amountToString(amount: string | undefined) {
    if (typeof amount !== "string") {
      return "";
    }
    const amount_value = parseFloat(amount) / 1e8;
    const amount_info = amount_value.toFixed(8).split(".");
    const int_str = amount_info[0] || "";
    const float_str = amount_info[1] || "";

    const tmp =
      int_str
        .split("")
        .reverse()
        .join("")
        .match(/\d{1,3}/g) || [];

    const formated_int_str = tmp
      .join(",")
      .split("")
      .reverse()
      .join("");
    return formated_int_str + "." + float_str;
  }
  amountToString = AniBase.amountToString;
}

export class CssAniBase extends AniBase {
  containerNode?: HTMLElement;
  _init() {
    // 重新初始化
    this._loop_runs.length = 0;
    if (
      !(
        this.containerNode &&
        this.containerNode.clientHeight &&
        this.containerNode.clientWidth
      )
    ) {
      this.raf(() => this._init());
      return false;
    }
    console.group("init-start");
    this.emit("init-start", this.containerNode);
    console.groupEnd();
    this.is_inited = true;
    return true;
  }
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
    return 1 - Math.cos((k * Math.PI) / 2);
  },
  Sinusoidal_Out(k: number) {
    return Math.sin((k * Math.PI) / 2);
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
      s = (p * Math.asin(1 / a)) / (2 * Math.PI);
    }
    return -(
      a *
      Math.pow(2, 10 * (k -= 1)) *
      Math.sin(((k - s) * (2 * Math.PI)) / p)
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
      s = (p * Math.asin(1 / a)) / (2 * Math.PI);
    }
    return (
      a * Math.pow(2, -10 * k) * Math.sin(((k - s) * (2 * Math.PI)) / p) + 1
    );
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
      s = (p * Math.asin(1 / a)) / (2 * Math.PI);
    }
    if ((k *= 2) < 1) {
      return (
        -0.5 *
        (a *
          Math.pow(2, 10 * (k -= 1)) *
          Math.sin(((k - s) * (2 * Math.PI)) / p))
      );
    }
    return (
      a *
        Math.pow(2, -10 * (k -= 1)) *
        Math.sin(((k - s) * (2 * Math.PI)) / p) *
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

const format_canvas = document.createElement("canvas");

/*默认居中裁剪*/
export async function formatImage(
  url: string, //|HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap,
  opts: {
    format: string /* = "image/png"*/;
    view_width: number;
    view_height: number;
    size: string; //"contain" | "cover"|"100[%][,[ 100[%]]]";
    position: string;
    target_encode: string /*base64,blob*/;
    encoderOptions?: number /*jpeg格式的质量*/;
    onlyBase64Content?: boolean /*是否只返回base64的内容，没有前缀“data:image/png;base64,”的那种*/;
  }
) {
  format_canvas.width = opts.view_width;
  format_canvas.height = opts.view_height;
  const ctx = format_canvas.getContext("2d");
  if (!ctx) {
    throw new Error("not support 2d canvas");
  }
  // if(typeof img ==="string"){
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.src = url;
    img.onload = resolve;
    img.onerror = reject;
  });
  /*宽高比例*/
  const { width: img_source_width, height: img_source_height } = img;

  /// size
  const img_rate = img_source_width / img_source_height;
  const view_rate = opts.view_width / opts.view_height;
  if (opts.size) {
    if (opts.size === "contain") {
      if (img.width > opts.view_width) {
        img.width = opts.view_width;
        img.height = opts.view_width / img_rate;
      }
      if (img.height > opts.view_height) {
        img.height = opts.view_height;
        img.width = opts.view_height * img_rate;
      }
    } else if (opts.size === "cover") {
      if (img_rate > view_rate) {
        // 源图是宽的，保证高度
        img.height = opts.view_height;
        img.width = opts.view_height * img_rate;
      } else if (view_rate === img_rate) {
        img.width = opts.view_width;
        img.height = opts.view_height;
      } else {
        // view_rate < img_rate 源图是窄的，保证宽度
        img.width = opts.view_width;
        img.height = opts.view_width / img_rate;
      }
    } else {
      const source_size_info = opts.size.split(/[\s,]{1,}/);
      const source_size_info_width = source_size_info[0].trim();
      const source_size_info_height = (
        source_size_info[1] || source_size_info_width
      ).trim();
      if (source_size_info_width.endsWith("%")) {
        img.width =
          (img_source_width *
            parseFloat(
              source_size_info_width.substr(
                0,
                source_size_info_width.length - 1
              )
            )) /
          100;
      } else if (isFinite(parseFloat(source_size_info_width))) {
        img.width = parseFloat(source_size_info_width);
      } else {
        console.warn(
          new Error(`no support size width: ${source_size_info_width}`)
        );
      }
      if (source_size_info_height.endsWith("%")) {
        img.height =
          (img_source_height *
            parseFloat(
              source_size_info_height.substr(
                0,
                source_size_info_height.length - 1
              )
            )) /
          100;
      } else if (isFinite(parseFloat(source_size_info_height))) {
        img.height = parseFloat(source_size_info_height);
      } else {
        console.warn(
          new Error(`no support size height: ${source_size_info_height}`)
        );
      }
    }
  }
  const img_scale_x = img.width / img_source_width;
  const img_scale_y = img.height / img_source_height;

  /// position
  let dstX = 0;
  let dstY = 0;
  const source_position_info = opts.position.split(/[\s,]{1,}/);
  const source_position_info_x = source_position_info[0].trim();
  const source_position_info_y = (
    source_position_info[1] || source_position_info_x
  ).trim();
  // 这里目前仅仅支持center，没有支持百分比、left/right/top/bottom等其它语义
  if (source_position_info_x === "center") {
    dstX = (opts.view_width - img.width) / 2;
  } else if (source_position_info_x.endsWith("%")) {
    dstX =
      (-parseFloat(
        source_position_info_x.substr(0, source_position_info_x.length - 1)
      ) /
        100) *
      img.width *
      img_scale_x;
  } else if (isFinite(parseFloat(source_position_info_x))) {
    dstX = -parseFloat(source_position_info_x) * img_scale_x || 0;
  } else {
    console.warn(new Error(`no support position x: ${source_position_info_x}`));
  }
  if (source_position_info_y === "center") {
    dstY = (opts.view_height - img.height) / 2;
  } else if (source_position_info_y.endsWith("%")) {
    dstY =
      (-parseFloat(
        source_position_info_y.substr(0, source_position_info_y.length - 1)
      ) /
        100) *
      img.height *
      img_scale_y;
  } else if (isFinite(parseFloat(source_position_info_y))) {
    dstY = -parseFloat(source_position_info_y) * img_scale_y || 0;
  } else {
    console.warn(new Error(`no support position y: ${source_position_info_y}`));
  }

  ctx.drawImage(img, dstX, dstY, img.width, img.height);
  if (opts.target_encode === "blob") {
    return await new Promise<Blob>((resolve, reject) => {
      format_canvas.toBlob(
        res => {
          if (res) {
            resolve(res);
          } else {
            reject(new Error("format "));
          }
        },
        opts.target_encode,
        opts.encoderOptions
      );
    });
  } else if (opts.target_encode === "base64") {
    const base64str = format_canvas.toDataURL(opts.format, opts.encoderOptions);
    if (!opts.onlyBase64Content) {
      return base64str;
    }
    const perfix_index = base64str.indexOf(",");
    const base64ctn = base64str.substr(perfix_index + 1);
    return base64ctn;
  } else {
    throw new TypeError(`unknown target encode: ${opts.target_encode}`);
  }
}
tryRegisterGlobal("formatImage", formatImage);

const _useable_image_list: HTMLImageElement[] = [];
export function preLoadImages(assets_list: string[], base_url = "") {
  const fetch_task_list = assets_list.map((url, i) => {
    const img = _useable_image_list.shift() || new Image();
    img.src = base_url + url;
    return new Promise<string>((resolve, reject) => {
      img.onload = () => {
        resolve(img.src);
        _useable_image_list.push(img); //进入回收站
      };
      img.onerror = e => {
        reject(e);
        _useable_image_list.push(img); //进入回收站
      };
    });
  });
  // return Promise.all(fetch_task_list);
  return fetch_task_list;
}
