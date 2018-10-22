
import EventEmitter from "eventemitter3";
import { getQueryVariable, formatQueryVariable } from "./queryVar";
import { global, tryRegisterGlobal } from "./globalHelper";
import debug from "debug";
import { PromiseOut } from "./PromiseOut";
const log = debug("IBT:baseConfig");

type WatchPropChangedOpts = {
  ignore_watch_for_getter?: boolean;
  not_autoinit_for_getter?: boolean;
}

/*项目启动的基本环境变量配置参数*/
class BaseConfig {
  private _event?: EventEmitter;
  get event() {
    return this._event || (this._event = new EventEmitter())
  }
  /**可见听的字段集合 */
  private _watchAbleKeySet?: Set<string>;
  public get watchAbleKeySet(): Set<string> {
    return this._watchAbleKeySet || (this._watchAbleKeySet = new Set<string>())
  }

  @AutoEmitPropChange({ save_to_ls: "HIDE_FLAG" })
  HIDE_FLAG = getQueryVariable("HIDE_FLAG")
  @AutoEmitPropChange({ save_to_ls: "BACKEND_VERSION" })
  BACKEND_VERSION = getQueryVariable("BACKEND_VERSION") || "v3.1.3/";
  @AutoEmitPropChange()
  APP_VERSION = global["APP_VERSION"];
  @AutoEmitPropChange({ save_to_ls: "SERVER_URL" })
  SERVER_URL = getQueryVariable("SERVER_URL") || "http://publish.ifmchain.org";
  @AutoEmitPropChange({ save_to_ls: "NET_VERSION" })
  NET_VERSION = getQueryVariable("NET_VERSION") || "mainnet";
  @AutoEmitPropChange({ save_to_ls: "MAGIC" })
  MAGIC = getQueryVariable("MAGIC") || "";
  @AutoEmitPropChange({ save_to_ls: "BLOCK_UNIT_TIME" })
  BLOCK_UNIT_TIME = parseFloat(getQueryVariable("BLOCK_UNIT_TIME") || "") || 128e3;

  @AutoEmitPropChange({ save_to_ls: "SEED_DATA" })
  SEED_DATE = formatQueryVariable("SEED_DATA", seed_data_str => {
    let seed_data = [2017, 11, 27, 16, 0, 0, 0];
    if (seed_data_str) {
      seed_data = seed_data_str.split(",").map(c => parseInt(c))
    }
    return seed_data;
  });
  @AutoEmitPropChange({ save_to_ls: "LATEST_APP_VERSION_URL" })
  LATEST_APP_VERSION_URL = getQueryVariable("LATEST_APP_VERSION_URL") || "https://www.ifmchain.com/api/app/version/latest";

  @WatchPropChanged(["SEED_DATE"], { ignore_watch_for_getter: true })
  get seedDateUTC() {
    const { SEED_DATE } = this;
    return Date.UTC(SEED_DATE[0], SEED_DATE[1], SEED_DATE[2], SEED_DATE[3], SEED_DATE[4], SEED_DATE[5], SEED_DATE[6]);
  }
  @WatchPropChanged(["SEED_DATE"], { ignore_watch_for_getter: true })
  get seedDateTimestamp() {
    return Math.floor(this.seedDateUTC / 1000);
  }
  @WatchPropChanged(["SEED_DATE"], { ignore_watch_for_getter: true })
  get seedDate() {
    return new Date(this.seedDateUTC);
  }
  @WatchPropChanged(["SEED_DATE"], { ignore_watch_for_getter: true })
  get timezoneoffset() {
    return -this.seedDate.getTimezoneOffset() * 60;
  }

  @WatchPropChanged(["MAGIC"], { ignore_watch_for_getter: true })
  get settingKeyPerfix() {
    return "SETTING@" + this.MAGIC + "#";
  }

  /**
   * 舰艇baseConfig存大写属性的变动与初始化
   * @param watch_prop_name 要监听的属性名
   * @param opts
   */
  WatchPropChanged(watch_prop_name: string | string[], opts?: WatchPropChangedOpts) {
    const watch_prop_name_list = typeof watch_prop_name === "string" ? [watch_prop_name] : watch_prop_name;
    if (watch_prop_name_list.some(watch_prop_name => !this.watchAbleKeySet.has(watch_prop_name))) {
      throw new Error(`baseConfig prop [${watch_prop_name}] unable to watch.`)
    }
    return WatchPropChanged(watch_prop_name_list, Object.assign({}, opts, {
      baseConfig_instance: this
    }));
  }
}


function AutoEmitPropChange(opts: { save_to_ls?: string } = {}) {
  return function (target: BaseConfig, prop_name: string, descriptor?: PropertyDescriptor) {
    if (descriptor) {
      throw new TypeError("AutoEmitPropChange could only for primitive value.");
    }
    target.watchAbleKeySet.add(prop_name);
    const CHANGE_EVENT_NAME = `${prop_name}:CHANGED`;
    let cur_val: any;
    let emit_lock: {
      p: Promise<void>,
      old_val: any,
    } | undefined;
    descriptor = {
      get() {
        return cur_val;
      },
      set(new_val) {
        if (new_val === cur_val) {
          return;
        }
        const old_val = cur_val;
        cur_val = new_val;
        if (opts.save_to_ls) {
          localStorage.setItem(opts.save_to_ls, cur_val);
        }
        if (emit_lock) {
          emit_lock.old_val = old_val;
          return;
        }
        emit_lock = {
          p: Promise.resolve().then(() => {
            target.event.emit(CHANGE_EVENT_NAME, cur_val, emit_lock!.old_val);
            // target.event.emit("*:CHANGED", propName, cur_val, emit_lock.old_val);
            emit_lock = undefined;
          }),
          old_val,
        }
      }
    }
    Object.defineProperty(target, prop_name, descriptor);
  }
};

function WatchPropChanged(watch_prop_name_list: string[], opts: WatchPropChangedOpts & {
  baseConfig_instance?: BaseConfig
} = {}) {
  return function (target: any, prop_name: string, descriptor: PropertyDescriptor) {
    const baseConfig = opts.baseConfig_instance || target;
    if (typeof descriptor.value === "function") {
      watch_prop_name_list.forEach(watch_prop_name => {
        baseConfig.event.on(`${watch_prop_name}:CHANGED`, descriptor.value);
      });
    } else if (typeof descriptor.get === "function") {
      const { ignore_watch_for_getter, not_autoinit_for_getter } = opts;
      const source_getter = descriptor.get;
      let cache_val: any;
      let cache_key_list: any[] = [];
      let update_lock: Promise<void> | undefined;
      descriptor.get = () => {
        checkAndUpdateCache(watch_prop_name_list.map(watch_prop_name => baseConfig[watch_prop_name]));
        return cache_val;
      }
      const checkAndUpdateCache = (cur_val_list: any[]) => {
        if (cur_val_list.every((val, i) => val === cache_key_list[i])) {
          return;
        }
        cache_key_list = cur_val_list;
        if (update_lock) {
          return;
        }
        update_lock = Promise.resolve().then(() => {
          cache_val = source_getter.call(target);
          update_lock = undefined;
          log("watch prop [%s] changed. [%s]: %O,", prop_name, watch_prop_name_list, cache_val);
        });
      };
      if (!not_autoinit_for_getter) {
        descriptor.get();
      }

      if (!ignore_watch_for_getter) {

        watch_prop_name_list.forEach(watch_prop_name => {
          baseConfig.event.on(`${watch_prop_name}:CHANGED`, checkAndUpdateCache);
        });
      }
    }
  }
};


export const baseConfig = new BaseConfig();

tryRegisterGlobal("baseConfig", baseConfig);
