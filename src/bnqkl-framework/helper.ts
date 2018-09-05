export * from "./BlizzardHash";
export const is_dev = (() => {
  const test_fun = function DEV_WITH_FULL_NAME() {};
  return test_fun.name === "DEV_WITH_FULL_NAME";
  // return isDevMode();
})();
export const global = typeof self === "object" ? self : window;
export function tryRegisterGlobal(name, obj) {
  if (is_dev) {
    return (global[name] = obj);
  }
}
import socketio from "socket.io-client";
import EventEmitter from "eventemitter3";

/*查询从外部进行配置的参数*/
export function getQueryVariable(variable: string) {
  var query = location.search.substring(1);
  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (decodeURIComponent(pair[0]) == variable) {
      return decodeURIComponent(pair[1]);
    }
  }
  if (typeof localStorage === "object") {
    const res = localStorage.getItem(variable);
    if (typeof res === "string") {
      return res;
    }
  }
  if (typeof sessionStorage === "object") {
    const res = sessionStorage.getItem(variable);
    if (typeof res === "string") {
      return res;
    }
  }
}

class WSIOInstance extends EventEmitter {
  constructor(public server_url: string, public nsp = "/web") {
    super();
  }
  get io_url_path() {
    return this.server_url + this.nsp;
  }
  private _onLine = navigator.onLine;
  get onLine() {
    return this._onLine;
  }
  private _reconnecting = false;
  getOnlineStatus() {
    if (this.onLine) {
      return true;
    }
    if (this._reconnecting) {
      return new Promise<boolean>((resolve, reject) => {
        this.once("ononline", () => resolve(true));
        this.once("onoffline", () => resolve(false));
      });
    }
    return false;
  }
  private _io?: SocketIOClient.Socket;
  get io() {
    if (!this._io) {
      const io = socketio(this.io_url_path, {
        transports: ["websocket"],
      });
      this._io = io;
      this._io.on("connect", () => {
        this._reconnecting = false;
        this._onLine = true;
        this.emit("ononline");
      });
      this._io.on("disconnect", () => {
        this._reconnecting = false;
        this._onLine = false;
        this.emit("onoffline");
      });
      this._io.on("connect_error", () => {
        this._reconnecting = false;
        this._onLine = false;
        this.emit("onoffline");
      });
      this._io.on("reconnecting", () => {
        this._reconnecting = true;
      });
      // 尝试自动重连，可能一开始服务就不可用，后面才可用的，所以reconnect没法正常工作
      setInterval(() => {
        if (io.connected === false) {
          io.connect();
        }
      }, 1e4);
    }
    return this._io;
  }
}
const WSIOInstanceMap = new Map<string, WSIOInstance>();

export function getSocketIOInstance(server_url: string, nsp: string) {
  const key = server_url + nsp;
  let ins = WSIOInstanceMap.get(key);
  if (!ins) {
    ins = new WSIOInstance(server_url, nsp);
  }
  return ins;
}

export const afCtrl = new class RafController {
  _raf_id_acc = 0;
  _raf_map = {};
  private _raf_register(callback) {
    this._raf_map[++this._raf_id_acc] = callback;
    if (this._cur_raf_id === null) {
      this._cur_raf_id = this.native_raf(t => {
        const raf_map = this._raf_map;
        this._raf_map = {};
        this._cur_raf_id = null;
        for (var _id in raf_map) {
          const cb = raf_map[_id];
          try {
            cb(t);
          } catch (err) {
            console.error(err);
          }
        }
      });
    }
    return this._raf_id_acc;
  }
  private _raf_unregister(id) {
    delete this._raf_map[id];
    var has_size = false;
    for (var _k in this._raf_map) {
      has_size = true;
      break;
    }
    if (has_size && this._cur_raf_id !== null) {
      this.native_unraf(this._cur_raf_id);
      this._cur_raf_id = null;
    }
  }
  private _cur_raf_id: number | null = null;
  native_raf(callback) {
    const raf = (
      window["__zone_symbol__requestAnimationFrame"] ||
      window["webkitRequestAnimationFrame"]
    ).bind(window);
    this.native_raf = raf;
    return raf(callback);
  }
  native_unraf(rafId) {
    const caf = (
      window["__zone_symbol__cancelAnimationFrame"] ||
      window["webkitCancelAnimationFrame"]
    ).bind(window);
    this.native_unraf = caf;
    return caf(rafId);
  }

  raf(callback) {
    return this._raf_register(callback);
  }
  caf(rafId) {
    return this._raf_unregister(rafId);
  }
}();

/*通用的AppUrl*/
var BACKEND_VERSION = getQueryVariable("BACKEND_VERSION") || "v3.0.1/";
export class AppUrl {
  static SERVER_URL = "http://127.0.0.1";
  static BACKEND_VERSION = BACKEND_VERSION;
  static getPathName(url: string) {
    return new URL(url).pathname.replace(
      "/api/" + AppUrl.BACKEND_VERSION,
      "/api/"
    );
  }
  constructor(public path: string) {}
  toString(query?) {
    const host =
      (this.disposable_server_url || AppUrl.SERVER_URL) +
      this.path.replace(/^\/api\//, "/api/" + AppUrl.BACKEND_VERSION);
    if (query) {
      let querystring = "?";
      for (var k in query) {
        querystring += `${k}=${encodeURIComponent(query[k])}`;
      }
      return host + querystring;
    }
    return host;
  }
  _disposable_server_url?: string;
  get disposable_server_url() {
    const res = this._disposable_server_url;
    this._disposable_server_url = undefined;
    return res;
  }
  disposableServerUrl(server_url: string) {
    this._disposable_server_url = server_url;
    return this;
  }
}

/*项目启动的基本环境变量配置参数*/
const SEED_DATE = [2017, 11, 27, 16, 0, 0, 0];

export const baseConfig = new class BaseConfig extends EventEmitter {
  APP_VERSION = global["APP_VERSION"];
  private _SERVER_URL = "";
  get SERVER_URL() {
    return this._SERVER_URL;
  }
  set SERVER_URL(v: string) {
    AppUrl.SERVER_URL = v;
    this._SERVER_URL = v;
    this.emitConfigChanged();
  }
  //  SERVER_URL = "http://47.104.142.234:6062";
  SEED_DATE = SEED_DATE;
  seedDateTimestamp = Math.floor(
    Date.UTC(
      SEED_DATE[0],
      SEED_DATE[1],
      SEED_DATE[2],
      SEED_DATE[3],
      SEED_DATE[4],
      SEED_DATE[5],
      SEED_DATE[6]
    ) / 1000
  );
  seedDate: Date = new Date(this.seedDateTimestamp * 1000);
  timezoneoffset = -this.seedDate.getTimezoneOffset() * 60;
  //  SERVER_URL = "http://test1.ifmchain.org:6062";
  SERVER_TIMEOUT = 1000;
  NET_VERSION = getQueryVariable("NET_VERSION") || "mainnet";
  MAGIC = getQueryVariable("MAGIC") || "";
  BLOCK_UNIT_TIME =
    parseFloat(getQueryVariable("BLOCK_UNIT_TIME") || "") || 128e3;

  get LATEST_APP_VERSION_URL() {
    return (
      getQueryVariable("LATEST_APP_VERSION_URL") ||
      "https://www.ifmchain.com/api/app/version/latest"
    );
  }
  SETTING_KEY_PERFIX = "SETTING@";

  private _emit_config_changed_lock?: Promise<void>;
  emitConfigChanged() {
    if (this._emit_config_changed_lock) {
      return;
    }
    this._emit_config_changed_lock = Promise.resolve().then(() => {
      this.emit("config-changed");
      this._emit_config_changed_lock = undefined;
    });
  }
}();
baseConfig.SERVER_URL =
  getQueryVariable("SERVER_URL") || "http://mainnet.ifmchain.org";

console.log(
  "%cSERVER_URL:",
  "font-size:2em;color:green;background-color:#DDD",
  baseConfig.SERVER_URL
);
export function fileInputEleFactory(ele_id: string, accept = "image/*") {
  const inputEle_id = "qrcodePicker";
  // 必须把触发函数写在click里头，不然安全角度来说，是无法正常触发的
  const inputEle =
    (document.getElementById(inputEle_id) as HTMLInputElement) ||
    document.createElement("input");
  if (inputEle.id !== inputEle_id) {
    inputEle.id = inputEle_id;
    inputEle.type = "file";
    inputEle.accept = "image/*";
    document.body.appendChild(inputEle);
    inputEle.style.position = "absolute";
    inputEle.style.zIndex = "-1000";
    inputEle.style.left = "0";
    inputEle.style.top = "0";
    inputEle.style.visibility = "hidden";
    inputEle.style.width = "0";
    inputEle.style.height = "0";
  }
  return inputEle;
}

/**垫片工具*/
export class Shim {
  constructor(public name = "", public auto_suffix = "") {}
  /**是否使用垫片*/
  is_use_shim = false;
  /**是否进行静态链接*/
  compile_into = false;
  By(shim_fun_name?: string) {
    const self = this;
    return function shim(target: any, name: string, des: PropertyDescriptor) {
      const source_fun = target[name];
      const shim_name =
        shim_fun_name === undefined ? name + self.auto_suffix : shim_fun_name;
      des.value = function(...args) {
        if (self.compile_into) {
          this[name] = self.is_use_shim ? this[shim_name] : source_fun;
        }
        if (self.is_use_shim) {
          return this[shim_name](...args);
        } else {
          return source_fun.apply(this, ...args);
        }
      };
      des.value.source_fun = source_fun;
    };
  }
  AOT(is_use_shim: boolean) {
    if (this.compile_into) {
      return false;
    }
    this.is_use_shim = is_use_shim;
    return (this.compile_into = true);
  }
}
/**用于将一些函数在运行的过程中，跳过一些固有的等待条件，使得运行更快*/
export class AOT {
  constructor(default_condition = false) {
    this._condition = default_condition;
  }
  /**JIT运行时的条件属性*/
  private _condition = false;
  /**是否进行静态链接*/
  compile_into = false;
  /**条件语句*/
  Then(then_fun_name: string) {
    const self = this;
    return function(target: any, name: string, des: PropertyDescriptor) {
      const source_fun = target[name];
      des.value = function(...args) {
        const { _condition } = self;
        if (self.compile_into) {
          this[name] = _condition ? this[then_fun_name] : source_fun;
        }
        if (_condition) {
          return this[then_fun_name](...args);
        } else {
          return source_fun.apply(this, args);
        }
      };
      des.value.source_fun = source_fun;
      return des;
    };
  }
  /**前置条件*/
  Wait(condition_promise_fun_name: string, skip_if_false = false) {
    const self = this;
    return function(target: any, name: string, des: PropertyDescriptor) {
      const source_fun = target[name];
      des.value = function(...args) {
        const { _condition } = self;
        if (self.compile_into) {
          if (!_condition) {
            console.warn("AOT-Wait's condition must be true");
          }
          this[name] = source_fun;
        }
        if (!_condition) {
          // 在条件不成立的时候，需要始终进行条件判断的等待
          this[condition_promise_fun_name](...args).then(pre_condition_res => {
            if (skip_if_false && !pre_condition_res) {
              return;
            }
            return source_fun.apply(this, args);
          });
        } else {
          return source_fun.apply(this, args);
        }
      };
      des.value.source_fun = source_fun;
      return des;
    };
  }
  compile(condition: boolean) {
    if (this.compile_into) {
      return false;
    }
    this._condition = condition;
    return (this.compile_into = true);
  }
}
