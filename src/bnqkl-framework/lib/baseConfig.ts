
import EventEmitter from "eventemitter3";
import { getQueryVariable, formatQueryVariable } from "./queryVar";
import { global } from "./globalHelper";
import debug from "debug";
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
  @AutoEmitPropChange()
  BACKEND_VERSION = getQueryVariable("BACKEND_VERSION") || "v3.1.3/";
  @AutoEmitPropChange()
  APP_VERSION = global["APP_VERSION"];
  @AutoEmitPropChange()
  SERVER_URL = getQueryVariable("SERVER_URL") || "http://publish.ifmchain.org";
  // @AutoEmitPropChange()
  // SERVER_TIMEOUT = 1000;
  @AutoEmitPropChange()
  NET_VERSION = getQueryVariable("NET_VERSION") || "mainnet";
  @AutoEmitPropChange()
  MAGIC = getQueryVariable("MAGIC") || "";
  @AutoEmitPropChange()
  BLOCK_UNIT_TIME = parseFloat(getQueryVariable("BLOCK_UNIT_TIME") || "") || 128e3;

  @AutoEmitPropChange()
  SEED_DATE = formatQueryVariable("SEED_DATA", seed_data_str => {
    let seed_data = [2017, 11, 27, 16, 0, 0, 0];
    if (seed_data_str) {
      seed_data = seed_data_str.split(",").map(c => parseInt(c))
    }
    return seed_data;
  });
  @AutoEmitPropChange()
  LATEST_APP_VERSION_URL = getQueryVariable("LATEST_APP_VERSION_URL") || "https://www.ifmchain.com/api/app/version/latest";

  @WatchPropChanged("SEED_DATE", { ignore_watch_for_getter: true })
  get seedDateUTC() {
    const { SEED_DATE } = this;
    return Date.UTC(SEED_DATE[0], SEED_DATE[1], SEED_DATE[2], SEED_DATE[3], SEED_DATE[4], SEED_DATE[5], SEED_DATE[6]);
  }
  @WatchPropChanged("SEED_DATE", { ignore_watch_for_getter: true })
  get seedDateTimestamp() {
    return Math.floor(this.seedDateUTC / 1000);
  }
  @WatchPropChanged("SEED_DATE", { ignore_watch_for_getter: true })
  get seedDate() {
    return new Date(this.seedDateUTC);
  }
  @WatchPropChanged("SEED_DATE", { ignore_watch_for_getter: true })
  get timezoneoffset() {
    return -this.seedDate.getTimezoneOffset() * 60;
  }

  @WatchPropChanged("MAGIC", { ignore_watch_for_getter: true })
  get settingKeyPerfix() {
    return "SETTING@" + this.MAGIC + "#";
  }
  /**可见听的字段集合 */
  readonly watchAbleKeySet = new Set<string>();

  /**
   * 舰艇baseConfig存大写属性的变动与初始化
   * @param watch_prop_name 要监听的属性名
   * @param opts
   */
  WatchPropChanged(watch_prop_name: string, opts?: WatchPropChangedOpts) {
    if (!this.watchAbleKeySet.has(watch_prop_name)) {
      throw new Error(`baseConfig prop [${watch_prop_name}] unable to watch.`)
    }
    return WatchPropChanged(watch_prop_name, Object.assign(opts, {
      baseConfig_instance: this
    }));
  }
}


function AutoEmitPropChange() {
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
  }
};

function WatchPropChanged(watch_prop_name: string, opts: WatchPropChangedOpts & {
  baseConfig_instance?: BaseConfig
} = {}) {
  return function (target: any, prop_name: string, descriptor: PropertyDescriptor) {
    const baseConfig = opts.baseConfig_instance || target;
    if (typeof descriptor.value === "function") {
      baseConfig.event.on(`${watch_prop_name}:CHANGED`, descriptor.value);
    } else if (typeof descriptor.get === "function") {
      const { ignore_watch_for_getter, not_autoinit_for_getter } = opts;
      const source_getter = descriptor.get;
      let cache_val: any;
      let cache_key: any;
      descriptor.get = () => {
        checkAndUpdateCache(baseConfig[watch_prop_name]);
        return cache_val;
      }
      const checkAndUpdateCache = (cur_val) => {
        if (cur_val === cache_key) {
          return;
        }
        cache_key = cur_val;
        cache_val = source_getter.call(target);
        log("watch prop [%s] changed. [%s]: %O,", prop_name, watch_prop_name, cache_val);
      };
      if (!not_autoinit_for_getter) {
        descriptor.get();
      }

      if (!ignore_watch_for_getter) {
        baseConfig.event.on(`${watch_prop_name}:CHANGED`, checkAndUpdateCache);
      }
    }
  }
};


export const baseConfig = new BaseConfig();
