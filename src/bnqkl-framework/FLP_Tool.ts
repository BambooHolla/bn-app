// import { isDevMode } from "@angular/core";
import { Clipboard } from "@ionic-native/clipboard";
import { TranslateService } from "@ngx-translate/core";
import EventEmitter from "eventemitter3";
import {
  ActionSheetController,
  AlertController,
  Alert,
  Platform,
  LoadingController,
  Loading,
  ToastController,
  ModalController,
  LoadingOptions,
} from "ionic-angular";
import { PromiseOut } from "./PromiseExtends";
import {
  is_dev,
  tryRegisterGlobal,
  global,
  getSocketIOInstance,
  afCtrl,
  baseConfig,
} from "./helper";
export { is_dev, tryRegisterGlobal, global };
import { getErrorFromAsyncerror, isErrorFromAsyncerror } from "./const";

export class FLP_Tool {
  constructor() {}
  // 全局弹出层控制器
  @FLP_Tool.FromGlobal actionSheetCtrl!: ActionSheetController;
  @FLP_Tool.FromGlobal alertCtrl!: AlertController;
  @FLP_Tool.FromGlobal loadingCtrl!: LoadingController;
  @FLP_Tool.FromGlobal toastCtrl!: ToastController;
  @FLP_Tool.FromGlobal modalCtrl!: ModalController;
  @FLP_Tool.FromGlobal platform!: Platform;
  @FLP_Tool.FromGlobal translate!: TranslateService;
  @FLP_Tool.FromGlobal clipboard!: Clipboard;
  formatAndTranslateMessage = formatAndTranslateMessage;
  static formatAndTranslateMessage = formatAndTranslateMessage;
  translateMessage = translateMessage;
  static translateMessage = translateMessage;

  _event?: EventEmitter;
  get event() {
    if (!this._event) {
      const event = new EventEmitter();
      this._event = event;
      // 根据web的线路情况来绑定在线情况
      ["ononline", "onoffline"].forEach(bind_io_ename => {
        this.webio.on(bind_io_ename, (...args) => {
          event.emit(bind_io_ename, ...args);
        });
      });
    }
    return this._event;
  }
  tryEmit(eventanme, ...args) {
    if (this._event) {
      return this._event.emit(eventanme, ...args);
    }
    return false;
  }

  static translateError(
    target: any,
    name: string,
    descriptor: PropertyDescriptor
  ) {
    const hidden_prop_name = `-G-${name}-`;
    const source_fun = descriptor.value;
    const throwTranslateError = err => {
      if (typeof err === "object" && err && err.message) {
        err.message = FLP_Tool.getTranslateSync(err.message);
        if (!(err instanceof Error)) {
          err = new Error(err.message);
        }
        throw err;
      }
      if (typeof err === "string") {
        throw FLP_Tool.getTranslateSync(err);
      }
      throw err;
    };
    descriptor.value = function translateErrorWrap(...args) {
      try {
        const res = source_fun.apply(this, args);
        if (res instanceof Promise) {
          return res.catch(throwTranslateError);
        }
        return res;
      } catch (err) {
        throwTranslateError(err);
      }
    };
    descriptor.value.source_fun = source_fun;
    return descriptor;
  }
  static get isInCordova() {
    return window["cordova"] && !(window["cordova"] instanceof HTMLElement);
  }
  static webio = getSocketIOInstance(baseConfig.SERVER_URL, "/web");
  get webio() {
    return FLP_Tool.webio;
  }
  static netWorkConnection() {
    if (this.webio.onLine) {
      return Promise.resolve();
    }
    return new Promise<void>(cb => {
      const once = () => {
        cb();
        this.webio.off("ononline", once);
      };
      this.webio.on("ononline", once);
    });
  }
  netWorkConnection = FLP_Tool.netWorkConnection;
  isArrayDiff<T>(
    source_list: T[],
    target_list: T[],
    item_parser: (item: T) => string | number
  ) {
    if (source_list.length !== target_list.length) {
      return true;
    }
    return source_list.some((source_item, i) => {
      return item_parser(source_item) !== item_parser(target_list[i]);
    });
  }
  async showConfirmDialog(
    message: string,
    ok_handle?: Function,
    cancel_handle?: Function,
    auto_open = true
  ) {
    const dialog = this.modalCtrl.create(
      "custom-dialog",
      {
        message,
        buttons: [
          {
            text: await this.getTranslate("CONFIRM"),
            cssClass: "ok",
            handler: () => {
              if (ok_handle instanceof Function) {
                return ok_handle();
              }
            },
          },
          {
            text: await this.getTranslate("CANCEL"),
            cssClass: "cancel",
            handler: () => {
              if (cancel_handle instanceof Function) {
                return cancel_handle();
              }
            },
          },
        ],
      },
      {
        enterAnimation: "custom-dialog-pop-in",
        leaveAnimation: "custom-dialog-pop-out",
      }
    );
    if (auto_open) {
      await dialog.present();
    }
    return dialog;
  }
  async _showCustomDialog(
    data: {
      title?: string;
      iconType?: string;
      subTitle?: string;
      message?: string;
      buttons?: any[];
    },
    auto_open = true
  ) {
    const dialog = this.modalCtrl.create("custom-dialog", data, {
      enterAnimation: "custom-dialog-pop-in",
      leaveAnimation: "custom-dialog-pop-out",
    });
    if (auto_open) {
      await dialog.present();
    }
    const getComponentInstance = () =>
      dialog && dialog.overlay && dialog.overlay["instance"];
    return Object.assign(dialog, {
      setTitle(new_title: string) {
        const instance = getComponentInstance();
        if (instance) {
          instance.content_title = new_title;
        } else {
          data.title = new_title;
        }
      },
      setSubTitle(new_subTitle: string) {
        const instance = getComponentInstance();
        if (instance) {
          instance.content_subTitle = new_subTitle;
        } else {
          data.subTitle = new_subTitle;
        }
      },
      setMessage(new_message: string) {
        const instance = getComponentInstance();
        if (instance) {
          instance.content_message = new_message;
        } else {
          data.message = new_message;
        }
      },
    });
  }
  async waitTipDialogConfirm(
    message,
    opts: {
      cancel_with_error?: boolean;
      false_text?: string;
      true_text?: string;
    } = {}
  ) {
    const res = new PromiseOut<boolean>();
    this._showCustomDialog(
      {
        // title: this.getTranslateSync("ADVICE"),
        title: await this.getTranslate("COZY_TIPS"),
        message: await translateMessage(message),
        buttons: [
          {
            text: await translateMessage(opts.false_text || "@@CANCEL"),
            cssClass: "cancel",
            handler: () => {
              if (opts.cancel_with_error) {
                res.reject(getErrorFromAsyncerror());
              } else {
                res.resolve(false);
              }
            },
          },
          {
            text: await translateMessage(opts.true_text || "@@OK_I_KNOWN"),
            cssClass: "ok",
            handler: () => {
              res.resolve(true);
            },
          },
        ],
      },
      true
    );
    return res.promise;
  }
  async showWarningDialog(
    title: string,
    subTitle?: string,
    message?: string,
    buttons?: any[],
    auto_open = true
  ) {
    return this._showCustomDialog(
      {
        title,
        iconType: "warning",
        subTitle,
        message,
        buttons,
      },
      auto_open
    );
  }
  async showSuccessDialog(
    title: string,
    subTitle?: string,
    message?: string,
    buttons?: any[],
    auto_open = true
  ) {
    return this._showCustomDialog(
      {
        title,
        iconType: "success",
        subTitle,
        message,
        buttons,
      },
      auto_open
    );
  }
  showErrorDialog(
    title: string,
    subTitle?: string,
    message?: string,
    buttons?: any[],
    auto_open = true
  ) {
    return this._showCustomDialog(
      {
        title,
        iconType: "error",
        subTitle,
        message,
        buttons,
      },
      auto_open
    );
  }
  private _isIOS?: boolean;
  get isIOS() {
    if (this._isIOS === undefined) {
      this._isIOS = this.platform.is("ios");
    }
    return this._isIOS;
  }
  private _isAndroid?: boolean;
  get isAndroid() {
    if (this._isAndroid === undefined) {
      this._isAndroid = this.platform.is("android");
    }
    return this._isAndroid;
  }
  private _isMobile?: boolean;
  get isMobile() {
    if (this._isMobile === undefined) {
      this._isMobile = this.platform.is("mobile");
    }
    return this._isMobile;
  }

  navigatorClipboard: {
    writeText: (text: string) => Promise<void>;
    readText: () => Promise<string>;
  } = navigator["clipboard"] || {
    writeText: text => this.clipboard.copy(text),
    readText: () => this.clipboard.paste(),
  };
  get localName() {
    return FLP_Tool.formatLocalName(this.translate.currentLang);
  }
  static formatLocalName(currentLang: string) {
    if (currentLang === "zh-cmn-Hans") {
      return "zh-cn"; // 使用国际化标准
    }
    if (currentLang === "zh-cmn-Hant") {
      return "zh-tw";
    }
    return currentLang;
  }

  private async _showCustomLoadingDialog(
    msg,
    opts: { auto_open?: boolean } & LoadingOptions
  ) {
    const dialog = this.loadingCtrl.create({
      content: await translateMessage(msg),
      cssClass: opts.cssClass,
    });
    if (opts.auto_open) {
      dialog.present();
    }
    return dialog;
  }
  /*系统级别的加载动画*/
  async showLogoLoading(msg, auto_open = true) {
    this._showCustomLoadingDialog(msg, { auto_open, cssClass: "logo-loading" });
  }
  showChainLoading(msg, auto_open = true) {
    this._showCustomLoadingDialog(msg, {
      auto_open,
      cssClass: "blockchain-loading",
    });
  }

  /**
   * 用于管理loading对象的对象池
   * 由于有的页面loading的显示时，用户可以直接无视返回上一级页面，所以就需要有一个对象池缓存这些对象并在页面离开的时候销毁它们
   *
   * @type {Set<Loading>}
   * @memberof FirstLevelPage
   */
  presented_loading_instances: Array<Loading> = [];

  // 页面上通用的辅助函数
  toFixed(num: any, fix_to: number, pre_fix?: number) {
    num = parseFloat(num) || 0;
    var res = num.toFixed(fix_to);
    if (pre_fix) {
      res = ("0".repeat(pre_fix - 1) + res).substr(
        -Math.max(res.length, fix_to ? fix_to + pre_fix + 1 : pre_fix)
      );
    }
    return res;
  }
  toBool(v: any) {
    if (v) {
      v = String(v);
      return v.toLowerCase() !== "false";
    }
    return false;
  }
  isFinite = isFinite;

  static FromGlobal(
    target: any,
    name: string,
    descriptor?: PropertyDescriptor
  ) {
    if (!descriptor) {
      const hidden_prop_name = `-G-${name}-`;
      descriptor = {
        enumerable: true,
        configurable: true,
        get() {
          return this[hidden_prop_name] || global[name];
        },
        set(v) {
          this[hidden_prop_name] = v;
        },
      };
      Object.defineProperty(target, name, descriptor);
    }
  }
  static FromNavParams(
    target: any,
    name: string,
    descriptor?: PropertyDescriptor
  ) {
    if (!descriptor) {
      const hidden_prop_name = `-P-${name}-`;
      descriptor = {
        enumerable: true,
        configurable: true,
        get() {
          if (hidden_prop_name in this) {
            return this[hidden_prop_name];
          } else {
            this.navParams &&
              this.navParams.get instanceof Function &&
              this.navParams.get(name);
          }
        },
        set(v) {
          this[hidden_prop_name] = v;
        },
      };
      Object.defineProperty(target, name, descriptor);
    }
  }
  static getTranslate(key: string | string[], interpolateParams?: Object) {
    return (window["translate"] as TranslateService)
      .get(key, interpolateParams)
      .take(1)
      .toPromise();
  }
  getTranslate(key: string | string[], interpolateParams?: Object) {
    return this.translate
      .get(key, interpolateParams)
      .take(1)
      .toPromise();
  }
  getTranslateSync(key: string | string[], interpolateParams?: Object): string {
    return this.translate.instant(key, interpolateParams);
  }
  static getTranslateSync(key: string | string[], interpolateParams?: Object) {
    return (window["translate"] as TranslateService).instant(
      key,
      interpolateParams
    );
  }
  static getProtoArray = getProtoArray;
  static addProtoArray = addProtoArray;
  static removeProtoArray = removeProtoArray;

  static raf: typeof afCtrl.raf = afCtrl.raf.bind(afCtrl);
  raf = FLP_Tool.raf;
  static caf: typeof afCtrl.caf = afCtrl.caf.bind(afCtrl);
  caf = FLP_Tool.caf;

  static toDateMS(date_arg) {
    return new Date(date_arg).valueOf();
  }
  toDateMS = FLP_Tool.toDateMS;
}

export function formatAndTranslateMessage(has_error: any, self?: FLP_Tool) {
  let err_message = "@@ERROR";
  let args;
  if (has_error instanceof Error) {
    err_message = has_error.message;
  } else if (has_error && has_error.message) {
    err_message = has_error.message.toString();
    if (has_error.detail && has_error.detail.i18n) {
      args = has_error.detail.i18n;
    }
  } else if (typeof has_error === "string") {
    err_message = has_error;
  }
  return translateMessage(err_message, args);
}

export function translateMessage(message: any, arg?: any, self?: FLP_Tool) {
  if (message instanceof Function) {
    message = message(arg);
  }
  return Promise.resolve(message).then(message => {
    message = "" + message;
    if (typeof message === "string" && message.startsWith("@@")) {
      const i18n_key = message.substr(2);
      message = () => (self || FLP_Tool).getTranslate(i18n_key);
    }
    if (message instanceof Function) {
      message = message(arg);
    }
    return message as string;
  });
}

// 存储在原型链上的数据（字符串）集合
const CLASS_PROTO_ARRAYDATA_POOL = (window[
  "CLASS_PROTO_ARRAYDATA_POOL"
] = new Map<string | Symbol, classProtoArraydata>());
const PA_ID_KEY =
  "@PAID:" +
  Math.random()
    .toString(36)
    .substr(2);
type classProtoArraydata = Map<string, string[]>;
export function getProtoArray(target: any, key: string) {
  var res = new Set();
  const CLASS_PROTO_ARRAYDATA = CLASS_PROTO_ARRAYDATA_POOL.get(key);
  if (CLASS_PROTO_ARRAYDATA) {
    do {
      if (target.hasOwnProperty(PA_ID_KEY)) {
        const arr_data = CLASS_PROTO_ARRAYDATA.get(target[PA_ID_KEY]);
        if (arr_data) {
          for (var item of arr_data) {
            res.add(item);
          }
        }
      }
    } while ((target = Object.getPrototypeOf(target)));
  }
  return res;
}
window["getProtoArray"] = getProtoArray;

let PA_ID_VALUE = 0;
export function addProtoArray(target: any, key: string, value: any) {
  var CLASS_PROTO_ARRAYDATA = CLASS_PROTO_ARRAYDATA_POOL.get(key);
  if (!CLASS_PROTO_ARRAYDATA) {
    CLASS_PROTO_ARRAYDATA = new Map();
    CLASS_PROTO_ARRAYDATA_POOL.set(key, CLASS_PROTO_ARRAYDATA);
  }

  const pa_id = target.hasOwnProperty(PA_ID_KEY)
    ? target[PA_ID_KEY]
    : (target[PA_ID_KEY] = "#" + PA_ID_VALUE++);
  var arr_data = CLASS_PROTO_ARRAYDATA.get(pa_id);
  if (!arr_data) {
    arr_data = [value];
    CLASS_PROTO_ARRAYDATA.set(pa_id, arr_data);
  } else {
    arr_data.push(value);
  }
}
export function removeProtoArray(target: any, key: string, value: any) {
  var CLASS_PROTO_ARRAYDATA = CLASS_PROTO_ARRAYDATA_POOL.get(key);
  if (!CLASS_PROTO_ARRAYDATA) {
    return;
  }

  const pa_id = target.hasOwnProperty(PA_ID_KEY)
    ? target[PA_ID_KEY]
    : (target[PA_ID_KEY] = "#" + PA_ID_VALUE++);
  var arr_data = CLASS_PROTO_ARRAYDATA.get(pa_id);
  if (!arr_data) {
    return;
  }
  const index = arr_data.indexOf(value);
  if (index !== -1) {
    arr_data.splice(index, 1);
  }
}
