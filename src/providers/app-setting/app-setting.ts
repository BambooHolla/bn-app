import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import "rxjs/add/operator/map";
import { BehaviorSubject, AsyncSubject, Observable } from "rxjs";
import {
  AsyncBehaviorSubject,
  Executor,
} from "../../bnqkl-framework/RxExtends";
export * from "../../bnqkl-framework/RxExtends";
import * as IFM from "ifmchain-ibt";
import * as EventEmitter from "eventemitter3";
import { AniBase } from "../../components/AniBase";
import { UserInfoProvider } from "../user-info/user-info";
import * as PIXI from "pixi.js";
import { TranslateService } from "@ngx-translate/core";
import * as PIXI_SOUND from "pixi-sound";
console.log(PIXI_SOUND);
import { FLP_Tool } from "../../bnqkl-framework/FLP_Tool";

export class AppUrl {
  constructor(public path) {}
  toString() {
    return AppSettingProvider.SERVER_URL + this.path;
  }
}
const net_version =
  getQueryVariable("NET_VERSION") || localStorage.getItem("NET_VERSION") || "";

const block_unit_time =
  parseFloat(
    getQueryVariable("BLOCK_UNIT_TIME") ||
      localStorage.getItem("BLOCK_UNIT_TIME") ||
      "",
  ) ||
  (net_version === "testnet" && 10e3);

const testnet_flag = document.createElement("div");
testnet_flag.id = "testnetFlag";
testnet_flag.innerHTML = `TESTNET`;

@Injectable()
export class AppSettingProvider extends EventEmitter {
  static APP_VERSION = window["APP_VERSION"];
  static SERVER_URL = "http://mainnet.ifmchain.org";
  // static SERVER_URL = "http://47.104.142.234:6062";
  static SEED_DATE = [2017, 11, 27, 16, 0, 0, 0];
  // static SERVER_URL = "http://test1.ifmchain.org:6062";
  static SERVER_TIMEOUT = 1000;
  static NET_VERSION = net_version || "mainnet";
  static BLOCK_UNIT_TIME = block_unit_time || 128e10;
  get BLOCK_UNIT_TIME() {
    return AppSettingProvider.BLOCK_UNIT_TIME;
  }
  static IFMJS = IFM(AppSettingProvider.NET_VERSION);
  static HTTP_PROVIDER = new AppSettingProvider.IFMJS.HttpProvider(
    AppSettingProvider.SERVER_URL,
    AppSettingProvider.SERVER_TIMEOUT,
  );
  APP_URL(path: string) {
    return new AppUrl(path);
  }

  static LATEST_APP_VERSION_URL = getQueryVariable("LATEST_APP_VERSION_URL") ||
  localStorage.getItem("LATEST_APP_VERSION_URL") ||
  "https://www.ifmchain.com/api/app/version/latest";
  static SETTING_KEY_PERFIX = "SETTING@";
  constructor(
    public http: Http,
    public user: UserInfoProvider,
    public translate: TranslateService,
  ) {
    super();
    console.log("Hello AppSettingProvider Provider");

    const user_token = this.getUserToken();

    // 初始化缓存中的user_info
    this.user.initUserInfo(user_token);

    this.user_token = new BehaviorSubject<string>(user_token);
    this.account_address = this.user_token
      .map(token => {
        const token_info = this.getUserToken();
        if (token_info) {
          return token_info.address;
        }
        return "";
      })
      .distinctUntilChanged<string>();

    const default_settings = { ...this.settings };
    // 将setting与本地存储进行关联
    for (let key in this.settings) {
      const get_s_key = () =>
        this.user.address &&
        AppSettingProvider.SETTING_KEY_PERFIX + key + ":" + this.user.address;
      const default_value = default_settings[key];
      Object.defineProperty(this.settings, key, {
        get: () => {
          let value = default_value;
          const s_key = get_s_key();
          if (s_key) {
            const current_json_value = localStorage.getItem(s_key);
            let should_write_in = true;
            if (typeof current_json_value === "string") {
              try {
                value = JSON.parse(current_json_value); //JSON可用
                should_write_in = false; // 不需要初始化写入
              } catch (e) {}
            }
            if (should_write_in) {
              localStorage.setItem(s_key, JSON.stringify(default_value));
            }
          }
          return value;
        },
        set: value => {
          const s_key = get_s_key();
          if (s_key) {
            localStorage.setItem(s_key, JSON.stringify(value));
            this.emit(`changed@setting.${key}`, value);
            this.emit(`changed@setting`, { key, value });
          }
        },
      });
    }

    // 省电模式
    this.on(
      "changed@setting.power_saving_mode",
      is_save => (this.settings.animation_switch = !is_save),
    );

    // 动画开关对动画的控制

    // 框架内置的AniBase
    {
      const _update = AniBase.prototype._update;
      const noop = function(t, diff_t) {
        if (this.force_update) {
          _update.call(this, t, diff_t);
        }
      };
      const toggle_update = is_ani => {
        AniBase.power_saving_mode = is_ani;
        AniBase.prototype._update = is_ani ? _update : noop;
      };
      toggle_update(this.settings.animation_switch);
      this.on("changed@setting.animation_switch", toggle_update);
    }
    // PIXI框架的循环
    {
      const noop = function(t) {
        if (this.force_update) {
          _update.call(this, t);
        }
      };
      const _update = PIXI.ticker.Ticker.prototype.update;
      const toggle_update = is_ani => {
        PIXI.ticker.Ticker.prototype.update = is_ani ? _update : noop;
      };
      toggle_update(this.settings.animation_switch);
      this.on("changed@setting.animation_switch", toggle_update);
    }

    // 声音开关
    {
      const _play = PIXI.sound.play;
      const noop = function(...args) {
        if (this.force_play_sound) {
          _play.apply(this, args);
        }
      } as typeof PIXI_SOUND.play;
      const toggle_play = is_play_sound => {
        PIXI.sound.play = is_play_sound ? _play : noop;
      };
      toggle_play(this.settings.sound_effect);
      this.on("changed@setting.sound_effect", toggle_play);
    }

    // 测试网络角标内容
    let ani_flag_frame_id;
    let pre_flag_transform;
    translate.stream(["TESTNET_FLAG"]).subscribe(values => {
      if (ani_flag_frame_id) {
        cancelAnimationFrame(ani_flag_frame_id);
        ani_flag_frame_id = null;
      }
      function setTran(transform: string | null) {
        testnet_flag.style.transform = testnet_flag.style.webkitTransform = transform;
      }
      function setTranDur(transitionDuration: string | null) {
        testnet_flag.style.transitionDuration = testnet_flag.style.webkitTransitionDuration = transitionDuration;
      }
      testnet_flag.innerHTML = values.TESTNET_FLAG;
      setTran(null);
      setTranDur("0ms"); // 确保下面计算出来的值是正确的
      const bound_rect = testnet_flag.getBoundingClientRect(); //reflow
      setTran(pre_flag_transform);
      FLP_Tool.raf(() => {
        setTranDur(null);
        setTran((pre_flag_transform = `scale(${55 / bound_rect.width})`));
      });
    });
  }
  private USER_TOKEN_STORE_KEY = "LOGIN_TOKEN";
  user_token: BehaviorSubject<string>;
  account_address: Observable<string>;
  private _token_timeout_ti: any;
  getUserToken() {
    try {
      // clearTimeout(this._token_timeout_ti);
      var tokenJson = localStorage.getItem(this.USER_TOKEN_STORE_KEY);
      if (!tokenJson) {
        return null;
      }
      var obj = JSON.parse(tokenJson);
      // if (obj.expiredTime && obj.expiredTime < Date.now()) {
      //   return "";
      // }
      // this._token_timeout_ti = setTimeout(() => {
      //   console.log("User Token 过期：", obj);
      //   this._setUserToken("");
      // }, obj.expiredTime - Date.now());
      return obj || null;
    } catch (e) {
      return null;
    }
  }
  setUserToken(obj: any) {
    if (typeof obj !== "string") {
      this.user.initUserInfo(obj);
      obj = JSON.stringify(obj);
    } else {
      throw new TypeError(
        "user token must be an object:{address,password,balance,fee}",
      );
    }
    localStorage.setItem(this.USER_TOKEN_STORE_KEY, obj);
    this._setUserToken(this.getUserToken());
  }
  clearUserToken() {
    localStorage.removeItem(this.USER_TOKEN_STORE_KEY);
    this._setUserToken(this.getUserToken());
  }
  private _setUserToken(token: string) {
    this.user_token.next(this.getUserToken());
  }
  /**高度*/
  height: BehaviorSubject<number> = new BehaviorSubject(1);
  /**当高度发生改变后要触发的，应用级别使用这个。
   确保不会因为height绑定而更新数据的触发函数还没触发就触发了应用界别的请求函数*/
  after_height: BehaviorSubject<number> = new BehaviorSubject(1);
  /**轮次*/
  round: BehaviorSubject<number> = new BehaviorSubject(1);
  after_round: BehaviorSubject<number> = new BehaviorSubject(1);
  setHeight(height: number) {
    if (this.getHeight() == height) {
      return;
    }
    this.height.next(height);
    this.after_height.next(height);
    const pre_round = this.getRound();
    const cur_round = this.calcRoundByHeight(height);
    if (cur_round !== pre_round) {
      this.setRound(cur_round);
    }
  }
  calcRoundByHeight(height) {
    return Math.ceil(height / 57);
  }
  getBlockNumberToRoundEnd(cur_height) {
    return 57 - cur_height % 57;
  }
  getRoundStartHeight(round_num: number) {
    return (round_num - 1) * 57 + 1;
  }
  getHeight() {
    return this.height.getValue();
  }
  setRound(round: number) {
    this.round.next(round);
    this.after_round.next(round);
  }
  getRound() {
    return this.round.getValue();
  }

  settings = {
    lang: "",
    /**指纹保护开关*/
    open_fingerprint_protection: false,
    /**指纹保护密码*/
    fingerprint_protection: "",
    /**后台挖矿*/
    background_mining: false,
    /**缓存用户最后一次发送投票的轮次*/
    digRound: 0,
    /**挖矿收益通知*/
    mining_income_notice: false,
    /**默认手续费*/
    default_fee: "0.00000000",
    /**只在wifi时挖矿*/
    mining_only_in_wifi: true,
    /**动画开关*/
    animation_switch: true,
    /**省电模式*/
    power_saving_mode: true, // 默认开启省电模式
    /**自动更新*/
    auto_update_app: false,
    /**自动更新手续费到前一轮的最低值*/
    auto_update_default_fee_to_pre_round_min: false,
    /**自动更新手续费到前一轮的最低值*/
    auto_update_default_fee_max_amount: "1.00000000",
    /**音效*/
    sound_effect: true,
    /**是否有过挖矿收益*/
    _has_mining_income: false,
    /**我的矿机*/
    my_mining_machine: [] as any[],
  };
}
if (AppSettingProvider.NET_VERSION === "testnet") {
  const testnet_flag_wrapper = document.createElement("div");
  testnet_flag_wrapper.appendChild(testnet_flag);
  testnet_flag_wrapper.className = "testnet-flag";
  document.body.appendChild(testnet_flag_wrapper);
}
function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (decodeURIComponent(pair[0]) == variable) {
      return decodeURIComponent(pair[1]);
    }
  }
  console.log("Query variable %s not found", variable);
}

const server_host =
  getQueryVariable("SERVER_HOST") || localStorage.getItem("SERVER_HOST") || "";
if (location.hostname === "dev-bnlc.bnqkl.cn") {
  AppSettingProvider.SERVER_URL = "http://dev-bnlc.bnqkl.cn:40001/api/v1/bngj/";
} else if (server_host.startsWith("HOME")) {
  let home_ip = location.hostname;
  if (server_host.startsWith("HOME:")) {
    home_ip = server_host.replace("HOME:", "").trim();
  }
  AppSettingProvider.SERVER_URL = `http://${home_ip}:40001/api/v1/bngj/`;
} else if (location.hostname === "wzx-bnlc.bnqkl.cn" || server_host === "WZX") {
  AppSettingProvider.SERVER_URL = "http://192.168.16.216:40001/api/v1/bngj/";
} else if (server_host.startsWith("FULL:")) {
  AppSettingProvider.SERVER_URL = server_host.replace("FULL:", "").trim();
}

console.log(
  "%cSERVER_URL:",
  "font-size:2em;color:green;background-color:#DDD",
  AppSettingProvider.SERVER_URL,
);

/**
 * 基于token的AsyncBehaviorSubjuet类型的属性/方法生成器
 * tokenBaseAsyncBehaviorSubjectGenerator
 *
 * @export
 * @param {any} target
 * @param {any} name
 * @param {any} descriptor
 */
export function TB_AB_Generator(
  target_prop_name: string,
  need_token = true,
  expiry_time_opts?: ExpiryTime & {
    loop?: boolean;
  },
) {
  return (target, name, descriptor) => {
    var executor: Executor<any> = descriptor.value;
    let _v: AsyncBehaviorSubject<any>;
    const timeout_auto_refresh = (from: Date) => {
      let refresh_time = calcExpiryTime(
        Object.assign({}, expiry_time_opts, { from }),
      );
      const do_refresh = () => {
        if (_v) {
          console.log(target_prop_name, "过期，强制刷新");
          _v.refresh(target_prop_name);
          if (expiry_time_opts && expiry_time_opts.loop) {
            timeout_auto_refresh(refresh_time);
          }
        }
      };
      const time_out = +refresh_time - Date.now();
      if (time_out < 0) {
        const time_span_val = +refresh_time - +from;
        // 将refresh_time推进到一个合适的值，确保下一次执行timeout_auto_refresh，得到的time_out正好>=0
        refresh_time = new Date(
          +refresh_time +
            ((Math.abs(time_out) / time_span_val) | 0) * time_span_val,
        );
        do_refresh();
      } else {
        setTimeout(do_refresh, time_out);
      }
      console.log("time_out", time_out);
    };
    console.log(target_prop_name);
    Object.defineProperty(target, target_prop_name, {
      get() {
        if (!_v) {
          if (!(this.appSetting instanceof AppSettingProvider)) {
            throw new Error(
              `${
                this.constructor.name
              } 需要注入依赖： (appSetting)AppSettingProvider`,
            );
          }
          (this.appSetting as AppSettingProvider).account_address
            .distinctUntilChanged()
            .subscribe(token => {
              if (need_token && !token) {
                return;
              }
              if (!_v) {
                _v = new AsyncBehaviorSubject(executor.bind(this));
                expiry_time_opts && timeout_auto_refresh(expiry_time_opts.from);
              } else {
                _v.refresh(target_prop_name);
              }
            });
        }
        return _v;
      },
    });
    return descriptor;
  };
}

/**
 * 基于height的AsyncBehaviorSubjuet类型的属性/方法生成器
 * tokenBaseAsyncBehaviorSubjectGenerator
 *
 * @export
 * @param {any} target
 * @param {any} name
 * @param {any} descriptor
 */
export function HEIGHT_AB_Generator(
  target_prop_name: string,
  need_token = false,
  expiry_time_opts?: ExpiryTime & {
    loop?: boolean;
  },
) {
  return (target, name, descriptor) => {
    var executor: Executor<any> = descriptor.value;
    let _v: AsyncBehaviorSubject<any>;
    const timeout_auto_refresh = (from: Date) => {
      let refresh_time = calcExpiryTime(
        Object.assign({}, expiry_time_opts, { from }),
      );
      const do_refresh = () => {
        if (_v) {
          console.log(target_prop_name, "过期，强制刷新");
          _v.refresh();
          if (expiry_time_opts && expiry_time_opts.loop) {
            timeout_auto_refresh(refresh_time);
          }
        }
      };
      const time_out = +refresh_time - Date.now();
      if (time_out < 0) {
        const time_span_val = +refresh_time - +from;
        // 将refresh_time推进到一个合适的值，确保下一次执行timeout_auto_refresh，得到的time_out正好>=0
        refresh_time = new Date(
          +refresh_time +
            ((Math.abs(time_out) / time_span_val) | 0) * time_span_val,
        );
        do_refresh();
      } else {
        setTimeout(do_refresh, time_out);
      }
      console.log("time_out", time_out);
    };
    console.log(target_prop_name);
    Object.defineProperty(target, target_prop_name, {
      get() {
        if (!_v) {
          const appSetting: AppSettingProvider = this.appSetting;
          if (!(appSetting instanceof AppSettingProvider)) {
            throw new Error(
              `${
                this.constructor.name
              } 需要注入依赖： (appSetting)AppSettingProvider`,
            );
          }
          const runner = height_or_token => {
            if (!height_or_token) {
              return;
            }
            if (!_v) {
              _v = new AsyncBehaviorSubject(executor.bind(this));
              expiry_time_opts && timeout_auto_refresh(expiry_time_opts.from);
            } else {
              _v.refresh(target_prop_name);
            }
          };
          appSetting.height.distinctUntilChanged().subscribe(runner);
          if (need_token) {
            appSetting.account_address.distinctUntilChanged().subscribe(runner);
          }
        }
        return _v;
      },
    });
    return descriptor;
  };
}
/**
 * 基于round的AsyncBehaviorSubjuet类型的属性/方法生成器
 * tokenBaseAsyncBehaviorSubjectGenerator
 *
 * @export
 * @param {any} target
 * @param {any} name
 * @param {any} descriptor
 */
export function ROUND_AB_Generator(
  target_prop_name: string,
  need_token = false,
  expiry_time_opts?: ExpiryTime & {
    loop?: boolean;
  },
) {
  return (target, name, descriptor) => {
    var executor: Executor<any> = descriptor.value;
    let _v: AsyncBehaviorSubject<any>;
    const timeout_auto_refresh = (from: Date) => {
      let refresh_time = calcExpiryTime(
        Object.assign({}, expiry_time_opts, { from }),
      );
      const do_refresh = () => {
        if (_v) {
          console.log(target_prop_name, "过期，强制刷新");
          _v.refresh(target_prop_name);
          if (expiry_time_opts && expiry_time_opts.loop) {
            timeout_auto_refresh(refresh_time);
          }
        }
      };
      const time_out = +refresh_time - Date.now();
      if (time_out < 0) {
        const time_span_val = +refresh_time - +from;
        // 将refresh_time推进到一个合适的值，确保下一次执行timeout_auto_refresh，得到的time_out正好>=0
        refresh_time = new Date(
          +refresh_time +
            ((Math.abs(time_out) / time_span_val) | 0) * time_span_val,
        );
        do_refresh();
      } else {
        setTimeout(do_refresh, time_out);
      }
      console.log("time_out", time_out);
    };
    console.log(target_prop_name);
    Object.defineProperty(target, target_prop_name, {
      get() {
        if (!_v) {
          const appSetting: AppSettingProvider = this.appSetting;
          if (!(appSetting instanceof AppSettingProvider)) {
            throw new Error(
              `${
                this.constructor.name
              } 需要注入依赖： (appSetting)AppSettingProvider`,
            );
          }
          const runner = height_or_token => {
            if (!height_or_token) {
              return;
            }
            if (!_v) {
              _v = new AsyncBehaviorSubject(executor.bind(this));
              expiry_time_opts && timeout_auto_refresh(expiry_time_opts.from);
            } else {
              _v.refresh(target_prop_name);
            }
          };
          appSetting.round.distinctUntilChanged().subscribe(runner);
          if (need_token) {
            appSetting.account_address.distinctUntilChanged().subscribe(runner);
          }
        }
        return _v;
      },
    });
    return descriptor;
  };
}

export type TimeSpan = {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
};
export type ExpiryTime = {
  from: Date;
  time_span: TimeSpan;
};
export function calcExpiryTime(expiry_time: ExpiryTime) {
  const { from, time_span } = expiry_time;
  const res_time = new Date(+from);
  for (let k in time_span) {
    const v = time_span[k] | 0;
    switch (k) {
      case "year":
        res_time.setFullYear(res_time.getFullYear() + v);
        break;
      case "month":
        res_time.setMonth(res_time.getMonth() + v);
        break;
      case "day":
        res_time.setDate(res_time.getDate() + v);
        break;
      case "hour":
        res_time.setHours(res_time.getHours() + v);
        break;
      case "minute":
        res_time.setMinutes(res_time.getMinutes() + v);
        break;
      case "second":
        res_time.setSeconds(res_time.getSeconds() + v);
        break;
    }
  }
  return res_time;
}
