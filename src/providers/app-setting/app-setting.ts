import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import "rxjs/add/operator/map";
import { BehaviorSubject, AsyncSubject } from "rxjs";
import {
  AsyncBehaviorSubject,
  Executor,
} from "../../bnqkl-framework/RxExtends";
import * as IFM from "ifmchain-ibt";

export class AppUrl {
  constructor(public path) {}
  toString() {
    if (this.path[0] === "/") {
      return AppSettingProvider.SERVER_URL + this.path;
    } else {
      return AppSettingProvider.SERVER_URL + "/api/" + this.path;
    }
  }
}

@Injectable()
export class AppSettingProvider {
  // static SERVER_URL = "http://mainnet.ifmchain.org";
  static SEED_DATE = [2017, 11, 27, 16, 0, 0, 0];
  static SERVER_URL = "http://test1.ifmchain.org:6062";
  static SERVER_TIMEOUT = 1000;
  static NET_VERSION = "mainnet";
  static IFMJS = IFM(AppSettingProvider.NET_VERSION);
  static HTTP_PROVIDER = new AppSettingProvider.IFMJS.HttpProvider(
    AppSettingProvider.SERVER_URL,
    AppSettingProvider.SERVER_TIMEOUT,
  );
  APP_URL(path: string) {
    return new AppUrl(path);
  }
  constructor(public http: Http) {
    console.log("Hello AppSettingProvider Provider");
    this.user_token = new BehaviorSubject<string>(this.getUserToken());
  }
  private USER_TOKEN_STORE_KEY = "LOGIN_TOKEN";
  user_token: BehaviorSubject<string>;
  private _token_timeout_ti: any;
  getUserToken() {
    try {
      // clearTimeout(this._token_timeout_ti);
      var tokenJson = localStorage.getItem(this.USER_TOKEN_STORE_KEY);
      // if (!tokenJson) {
      //   return "";
      // }
      var obj = JSON.parse(tokenJson);
      // if (obj.expiredTime && obj.expiredTime < Date.now()) {
      //   return "";
      // }
      // this._token_timeout_ti = setTimeout(() => {
      //   console.log("User Token 过期：", obj);
      //   this._setUserToken("");
      // }, obj.expiredTime - Date.now());
      return obj || "";
    } catch (e) {
      return "";
    }
  }
  setUserToken(obj: any) {
    if (typeof obj !== "string") {
      obj = JSON.stringify(obj);
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
          if (expiry_time_opts.loop) {
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
              `${this.constructor.name} 需要注入依赖： (appSetting)AppSettingProvider`,
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
