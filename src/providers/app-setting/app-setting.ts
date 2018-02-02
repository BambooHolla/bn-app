import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import "rxjs/add/operator/map";
import { BehaviorSubject, AsyncSubject } from "rxjs";
import {
  AsyncBehaviorSubject,
  Executor,
} from "../../bnqkl-framework/RxExtends";
export * from "../../bnqkl-framework/RxExtends";
import * as IFM from "ifmchain-ibt";
import { EventEmitter } from "eventemitter3";
import { AniBase } from "../../components/AniBase";
import { UserInfoProvider } from "../user-info/user-info";
import * as PIXI from "pixi.js";

export class AppUrl {
  constructor(public path) {}
  toString() {
    return AppSettingProvider.SERVER_URL + this.path;
  }
}
const net_version =
  getQueryVariable("NET_VERSION") || localStorage.getItem("NET_VERSION") || "";

@Injectable()
export class AppSettingProvider extends EventEmitter {
  // static SERVER_URL = "http://mainnet.ifmchain.org";
  static SERVER_URL = "http://47.104.142.234:6062";
  static SEED_DATE = [2017, 11, 27, 15, 58, 36, 0];
  // static SERVER_URL = "http://test1.ifmchain.org:6062";
  static SERVER_TIMEOUT = 1000;
  static NET_VERSION = net_version || "mainnet";
  static IFMJS = IFM(AppSettingProvider.NET_VERSION);
  static HTTP_PROVIDER = new AppSettingProvider.IFMJS.HttpProvider(
    AppSettingProvider.SERVER_URL,
    AppSettingProvider.SERVER_TIMEOUT,
  );
  APP_URL(path: string) {
    return new AppUrl(path);
  }

  static SETTING_KEY_PERFIX = "SETTING@";
  constructor(public http: Http, public user: UserInfoProvider) {
    super();
    console.log("Hello AppSettingProvider Provider");

    const user_token = this.getUserToken();

    // 初始化缓存中的user_info
    this.user.initUserInfo(user_token);

    this.user_token = new BehaviorSubject<string>(user_token);

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

    // 动画开关对动画的控制

    const noop = () => {};
    // 框架内置的AniBase
    {
      const _update = AniBase.prototype._update;
      const toggle_update = is_ani => {
        AniBase.prototype._update = is_ani ? _update : noop;
      };
      toggle_update(this.settings.animation_switch);
      this.on("changed@setting.animation_switch", toggle_update);
    }
    // PIXI框架的循环
    {
      const _update = PIXI.ticker.Ticker.prototype.update;
      const toggle_update = is_ani => {
        PIXI.ticker.Ticker.prototype.update = is_ani ? _update : noop;
      };
      toggle_update(this.settings.animation_switch);
      this.on("changed@setting.animation_switch", toggle_update);
    }
  }
  private USER_TOKEN_STORE_KEY = "LOGIN_TOKEN";
  user_token: BehaviorSubject<string>;
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
  /**轮次*/
  round: BehaviorSubject<number> = new BehaviorSubject(1);
  setHeight(height: number) {
    this.height.next(height);
    const pre_round = this.getRound();
    const cur_round = (height / 57) | 0;
    if (cur_round !== pre_round) {
      this.setRound(cur_round);
    }
  }
  getHeight() {
    return this.height.getValue();
  }
  setRound(round: number) {
    this.round.next(round);
  }
  getRound() {
    return this.round.getValue();
  }

  settings = {
    /**指纹保护开关*/
    open_fingerprint_protection: false,
    /**指纹保护密码*/
    fingerprint_protection: "",
    /**后台挖矿*/
    background_mining: false,
    /** ? 不知道这个是什么用的，要问俊杰*/
    digRound: 0,
    /**挖矿收益通知*/
    mining_income_notice: false,
    /**默认手续费*/
    default_fee: "0.00000000",
    /**只在wifi时挖矿*/
    mining_only_in_wifi: true,
    /**动画开关*/
    animation_switch: true,
    /**自动更新*/
    auto_update_app: false,
    /**自动更新手续费到前一轮的最低值*/
    auto_update_default_fee_to_pre_round_min: false,
    /**自动更新手续费到前一轮的最低值*/
    auto_update_default_fee_max_amount: "0.00000100",
  };
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
          if (!(this.appSetting instanceof AppSettingProvider)) {
            throw new Error(
              `${
                this.constructor.name
              } 需要注入依赖： (appSetting)AppSettingProvider`,
            );
          }
          this.appSetting.user_token.subscribe(token => {
            if (need_token && !token) {
              return;
            }
            if (!_v) {
              _v = new AsyncBehaviorSubject(executor.bind(this));
              expiry_time_opts && timeout_auto_refresh(expiry_time_opts.from);
            } else {
              _v.refresh();
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
          appSetting.height.subscribe(height => {
            if (!_v) {
              _v = new AsyncBehaviorSubject(executor.bind(this));
              expiry_time_opts && timeout_auto_refresh(expiry_time_opts.from);
            } else {
              _v.refresh();
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
          appSetting.round.subscribe(round => {
            if (!_v) {
              _v = new AsyncBehaviorSubject(executor.bind(this));
              expiry_time_opts && timeout_auto_refresh(expiry_time_opts.from);
            } else {
              _v.refresh();
            }
          });
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
