import {
  AlertController,
  AlertOptions,
  ToastOptions,
  LoadingController,
  LoadingOptions,
  Loading,
  Content,
  ToastController,
  Modal,
  Alert,
} from "ionic-angular";
import {
  PAGE_STATUS,
  getErrorFromAsyncerror,
  isErrorFromAsyncerror,
} from "./const";
export { getErrorFromAsyncerror, isErrorFromAsyncerror };
import { Toast } from "@ionic-native/toast";
import { TranslateService } from "@ngx-translate/core";
import {
  FLP_Tool,
  formatAndTranslateMessage,
  translateMessage,
} from "./FLP_Tool";
export { formatAndTranslateMessage, translateMessage };
import { AbortError, PromiseOut } from "./PromiseExtends";

function getTranslateSync(key: string | string[], interpolateParams?: Object) {
  return window["translate"].instant(key, interpolateParams);
}

export interface ErrorAlertOptions extends AlertOptions {
  independent?: boolean;
}
export type ErrorOptions =
  | ErrorAlertOptions
  | ((self: FLP_Tool) => ErrorAlertOptions)
  | ((self: FLP_Tool) => Promise<ErrorAlertOptions>);
/** 默认情况下，同样的错误信息只显示一个，除非指定 independent 为true*/
const ERROR_LAYER_MAP = new Map<string, Alert | Modal>();

export function asyncErrorWrapGenerator(
  error_title: any = () => FLP_Tool.getTranslate("ERROR"),
  opts?: ErrorOptions,
  hidden_when_page_leaved = true,
  keep_throw = false,
  dialogGenerator?: (
    params,
    self: FLP_Tool,
  ) => Modal | Alert | Promise<Modal> | Promise<Alert>,
) {
  return function asyncErrorWrap(target, name, descriptor) {
    const source_fun = descriptor.value;
    descriptor.value = function ErrorWrap(...args) {
      var page_leaved = false;
      if ("PAGE_STATUS" in this) {
        this.event.once("didLeave", () => {
          page_leaved = true;
        });
      }
      return source_fun
        .apply(this, args)
        .then(data => {
          if (data && data.__source_err__) {
            // 获取隐藏的异常将其抛出
            return Promise.reject(data.__source_err__);
          }
          return data;
        })
        .catch(err => {
          if (isErrorFromAsyncerror(err)) {
            // 这个error已经弹出过了，就不在弹出了
            return keep_throw ? Promise.reject(err) : err;
          }
          var err_msg;
          if (err instanceof Error) {
            err_msg = err.message;
          } else if (err.message) {
            err_msg = err.message + "";
          } else if (err.exception) {
            err_msg = err.exception + "";
          } else {
            err_msg = err + "";
          }
          console.group("CATCH BY asyncErrorWrapGenerator:");
          console.warn(err);
          console.groupEnd();
          if (hidden_when_page_leaved && page_leaved) {
            console.log(
              "%c不弹出异常提示因为页面的切换 " + (this.cname || ""),
              "color:yellow",
            );
            return getErrorFromAsyncerror(keep_throw);
          }

          if (!dialogGenerator) {
            const alertCtrl: AlertController = this.alertCtrl;
            if (!(alertCtrl instanceof AlertController)) {
              console.warn(
                "需要在",
                target.constructor.name,
                "中注入 AlertController 依赖",
              );
              dialogGenerator = (params: { title: string }) => {
                return {
                  present() {
                    alert(params.title);
                    this.__did_dismiss_cb_list.forEach(cb => cb());
                  },
                  __did_dismiss_cb_list: [],
                  onDidDismiss(cb) {
                    this.__did_dismiss_cb_list.push(cb);
                  },
                } as any;
              };
            } else {
              dialogGenerator = params => {
                return alertCtrl.create(params);
              };
            }
          }
          const _dialogGenerator = dialogGenerator;

          error_title = translateMessage(error_title, err);
          err_msg = translateMessage(err_msg, err);

          Promise.all([
            error_title,
            err_msg,
            opts instanceof Function ? opts(this) : opts,
          ]).then(
            ([error_title, err_msg, opts]: [
              string,
              string,
              ErrorAlertOptions | undefined
            ]) => {
              const dialog_opts = Object.assign(
                {
                  title: String(error_title),
                  subTitle: String(err_msg),
                  buttons: [getTranslateSync("CONFIRM")],
                },
                opts,
              );
              const present_able = _dialogGenerator(dialog_opts, this);
              Promise.resolve<Modal | Alert>(present_able).then(p => {
                if (opts && opts.independent) {
                  p.present();
                } else {
                  const p_key = JSON.stringify(opts);
                  if (!ERROR_LAYER_MAP.has(p_key)) {
                    // 如果已经有了，那么就不用在弹出了
                    ERROR_LAYER_MAP.set(p_key, p);
                    p.present();
                    p.onDidDismiss(() => {
                      FLP_Tool.raf(() => {
                        ERROR_LAYER_MAP.delete(p_key);
                      });
                    });
                  } else {
                    console.warn("弹出层已经存在，不重复弹出", dialog_opts);
                  }
                }
              });
            },
          );
          return getErrorFromAsyncerror(keep_throw);
        });
    };
    descriptor.value.source_fun = source_fun;
    return descriptor;
  };
}
export function asyncSuccessWrapGenerator(
  success_msg: any = () => FLP_Tool.getTranslate("SUCCESS"),
  position = "bottom",
  duration = 3000,
  hidden_when_page_leaved = true,
) {
  return function asyncSuccessWrap(target, name, descriptor) {
    const source_fun = descriptor.value;
    descriptor.value = function SuccessWrap(...args) {
      return source_fun.apply(this, args).then(data => {
        if (isErrorFromAsyncerror(data) || data instanceof AbortError) {
          return data;
        }
        if (
          hidden_when_page_leaved &&
          // this.hasOwnProperty("PAGE_STATUS") &&
          isFinite(this.PAGE_STATUS) &&
          this.PAGE_STATUS > PAGE_STATUS.WILL_LEAVE
        ) {
          console.log("不弹出成功提示因为页面的切换");
          return data;
        }
        success_msg = translateMessage(success_msg, data);

        if ("plugins" in window && "toast" in window["plugins"]) {
          const toast = window["toast"] as Toast;
          Promise.resolve(success_msg).then(message => {
            toast.show(String(message), duration + "", position).toPromise();
          });
        } else {
          const toastCtrl: ToastController = this.toastCtrl;
          if (!(toastCtrl instanceof ToastController)) {
            console.warn(
              "需要在",
              target.constructor.name,
              "中注入 ToastController 依赖",
            );
            alert(String(success_msg));
          } else {
            Promise.resolve(success_msg).then(message => {
              toastCtrl
                .create({
                  message: String(message),
                  position,
                  duration,
                })
                .present();
            });
          }
        }
        return data;
      });
    };
    descriptor.value.source_fun = source_fun;
    return descriptor;
  };
}

const loadingIdLock = (window["loadingIdLock"] = new Map<
  string,
  {
    // readonly is_presented: boolean;
    loading?: Loading;
    promises: Set<Promise<any>>;
  }
>());
export function asyncLoadingWrapGenerator(
  loading_msg: any = () => FLP_Tool.getTranslate("PLEASE_WAIT"),
  check_prop_before_present?: string,
  opts?: LoadingOptions & { dismiss_hanlder_name?: string },
  id?: string,
  export_to_proto_name?: string,
) {
  if (id) {
    var id_info = loadingIdLock.get(id);
    if (!id_info) {
      id_info = {
        // get is_presented() {
        //   return this.promises.size && this.loading;
        // },
        loading: undefined,
        promises: new Set<Promise<any>>(),
      };
      loadingIdLock.set(id, id_info);
    }
  }
  return function asyncLoadingWrap(target, name, descriptor) {
    const source_fun = descriptor.value;
    descriptor.value = function(...args) {
      const loadingCtrl: LoadingController = this.loadingCtrl;
      if (!(loadingCtrl instanceof LoadingController)) {
        throw new Error(
          target.constructor.name + " 缺少 LoadingController 依赖",
        );
      }
      // 创建loading
      loading_msg = translateMessage(loading_msg, null);

      Promise.resolve(loading_msg).then(loading_msg => {
        loading.setContent(String(loading_msg));
      });

      const loadingOpts = Object.assign(
        {
          content: String(loading_msg),
          cssClass: (this.PAGE_LEVEL | 0) > 1 ? "can-goback" : "",
        },
        opts,
      );
      const loading = loadingCtrl.create(loadingOpts);
      if (export_to_proto_name !== undefined) {
        this[export_to_proto_name] = loading;
      }
      // 执行promise
      const res = source_fun.apply(this, args);

      // 进行唯一检查
      if (check_prop_before_present && this[check_prop_before_present]) {
        // 检测到不用弹出
        return res;
      }
      if (id_info) {
        // 加入到集合中
        id_info.promises.add(res);
      }

      loading.onWillDismiss(() => {
        loading["_is_dissmissed"] = true;
      });
      loading["_my_present"] = () => {
        if (loading["_is_presented"] || loading["_is_dissmissed"]) {
          return;
        }
        loading["_is_presented"] = true;
        loading.present();
        const checkLoadingPageRef = () => {
          if (!loading.pageRef()) {
            return FLP_Tool.raf(checkLoadingPageRef);
          }
          if (
            this.content instanceof Content &&
            loadingOpts.cssClass.split(/\s+/).indexOf("can-goback") !== -1
          ) {
            const loadingEle = loading.pageRef().nativeElement;
            loadingEle.style.marginTop = this.content._hdrHeight + "px";
            console.log(loadingEle, this.content._hdrHeight);
          }
        };
        FLP_Tool.raf(checkLoadingPageRef);
      };
      const loading_present = (...args) => {
        if (id_info) {
          if (!id_info.loading) {
            id_info.loading = loading;
            loading["_my_present"]();
          }
        } else {
          loading["_my_present"]();
        }
      };

      loading["_my_dismiss"] = () => {
        if (loading["_is_dissmissed"]) {
          return;
        }
        loading["_is_dissmissed"] = true;
        if (loading["_is_presented"]) {
          loading.dismiss();
        }
      };
      let before_dismiss: Function | undefined;
      const loading_dismiss = (...args) => {
        before_dismiss && before_dismiss();
        if (id_info) {
          if (id_info.promises.has(res)) {
            // 从集合中移除
            id_info.promises.delete(res);
            if (id_info.promises.size === 0 && id_info.loading) {
              id_info.loading["_my_dismiss"]();
              id_info.loading = undefined;
            }
          }
        } else {
          loading["_my_dismiss"]();
        }
      };
      if (loadingOpts.dismiss_hanlder_name) {
        this[loadingOpts.dismiss_hanlder_name] = loading_dismiss;
      }
      if ("PAGE_STATUS" in this) {
        // 还没进入页面
        const run_loading_present = with_dealy => {
          before_dismiss = undefined;
          with_dealy ? setImmediate(loading_present) : loading_present();
          this.event.once("didLeave", loading_dismiss);
        };
        if (this.PAGE_STATUS <= PAGE_STATUS.WILL_ENTER) {
          // 等到进入页面后再开始调用
          this.event.on("didEnter", run_loading_present);
          // before_dismiss = () => {
          //   this.event.off("didEnter", run_loading_present);
          // };
        } else if (this.PAGE_STATUS === PAGE_STATUS.DID_ENTER) {
          run_loading_present(true);
          this.event.on("didEnter", run_loading_present);
        } else {
          debugger;
        }
      } else {
        console.warn("loading修饰器请与FirstLevelPage或者其子类搭配使用最佳");
        loading_present();
      }

      return res
        .then(data => {
          // 这里的触发可能会比didEnter的触发更早
          // 所以应该在执行的时候移除掉present的显示
          loading_dismiss();
          return data;
        })
        .catch(err => {
          loading_dismiss();
          return Promise.reject(err);
        });
    };
    descriptor.value.source_fun = source_fun;
    return descriptor;
  };
}
export function autoRetryWrapGenerator(
  maxSeconed_or_timeGenerator?:
    | (() => IterableIterator<number>)
    | number
    | {
        max_retry_seconed?: number;
        max_retry_times?: number;
      },
  onAbort?: Function,
) {
  var max_retry_seconed = 16;
  var max_retry_times = 5; // 默认最多重试5次
  if (
    typeof maxSeconed_or_timeGenerator == "number" &&
    maxSeconed_or_timeGenerator > 0
  ) {
    max_retry_seconed = maxSeconed_or_timeGenerator;
  }
  var timeGenerator: () => IterableIterator<number>;
  if (maxSeconed_or_timeGenerator instanceof Function) {
    timeGenerator = maxSeconed_or_timeGenerator;
  } else {
    timeGenerator = function*() {
      var second = 1;
      var times = 0;
      do {
        yield second;
        times += 1;
        if (times >= max_retry_times) {
          // 重试太多了，终止
          return;
        }
        if (second < max_retry_seconed) {
          second *= 2;
        }
        if (second > max_retry_seconed) {
          second = max_retry_seconed;
        }
      } while (true);
    };
  }
  const time_gen = timeGenerator();
  return function(target, name, descriptor) {
    const source_fun = descriptor.value;
    // 强制转为异步函数
    descriptor.value = async function loop(...args) {
      var keep_retry = true;
      do {
        //断网的状态下停止运行，直到联网
        await FLP_Tool.netWorkConnection();
        try {
          // 不论同步还是异步，都进行await
          // 如果成功，直接返回，中断重试循环
          return await source_fun.apply(this, args);
        } catch (err) {
          // 有其它任务的执行导致当前任务中断，直接返回不再做任何处理
          if (err instanceof AbortError) {
            return err;
          }
          console.warn(err);
          const time_info = time_gen.next(err);
          if (time_info.done) {
            // 声明中断循环
            keep_retry = false;
            if (onAbort) {
              onAbort(err);
            } else {
              // 停止了重试，抛出异常，中断重试循环
              throw err;
            }
          } else {
            await new Promise(cb => setTimeout(cb, time_info.value * 1e3));
          }
        }
      } while (keep_retry);
    };
    descriptor.value.source_fun = source_fun;
    return descriptor;
  };
}

export function singleRunWrap(opts: { lock_prop_key?: string } = {}) {
  return function(target, name, descriptor) {
    const source_fun = descriptor.value;
    var run_lock: PromiseOut<any> | undefined;
    descriptor.value = async function lock(...args) {
      if (run_lock) {
        return run_lock.promise;
      }
      if (opts.lock_prop_key) {
        this[opts.lock_prop_key] = true;
      }
      run_lock = new PromiseOut();
      const promise = run_lock.promise;
      try {
        const res = await source_fun.apply(this, args);
        run_lock.resolve(res);
      } catch (err) {
        run_lock.reject(err);
      } finally {
        run_lock = undefined;
        if (opts.lock_prop_key) {
          this[opts.lock_prop_key] = false;
        }
      }
      return promise;
    };
    descriptor.value.source_fun = source_fun;
    return descriptor;
  };
}

/** 确保一个时间点内只有一个任务在执行
 *  这个工具函数，主要是因为在读取数据的同时还要写入数据，所以模拟了原子性，将任务排队。
 *  还有一种场景，就是注册触发函数，被动触发的函数可能会有多个入口
 *  ，在一些极端情况下，这些入口可能会被同时触发，这时候就需要将这些任务进行合并
 */
export function queneTask(
  opts: {
    // 在开始执行的时候，对某个参数进行true赋值
    lock_prop_key?: string;
    // 多个任务一起排队时，最多允许几个任务在队列中，自动将后面的任务合并成一个任务
    // 如果为1，那么意味着如果当前有任务在跑，后面的任务都会使用这个的返回值，如果为2，就等于最多有两个在队列，一个在跑，一个在等，其它使用第二个的结果
    can_mix_queue?: number;
  } = {},
) {
  return function(target, name, descriptor) {
    const source_fun = descriptor.value;
    var run_lock: Promise<any> = Promise.resolve();
    var queue_num = 0;
    descriptor.value = async function queue(...args) {
      const { lock_prop_key } = opts;
      queue_num += 1;
      if (lock_prop_key) {
        this[lock_prop_key] = true;
      }
      const resolve = res => {
        if (lock_prop_key) {
          this[lock_prop_key] = false;
        }
        queue_num -= 1;
        return res;
      };
      const reject = err => {
        throw resolve(err);
      };
      // 任务合并
      if (opts.can_mix_queue && queue_num > opts.can_mix_queue) {
        return run_lock.then(resolve, reject);
      }
      return (run_lock = run_lock
        .then(per_res => source_fun.apply(this, args))
        .then(resolve, reject));
    };
    descriptor.value.source_fun = source_fun;
    return descriptor;
  };
}

export function tttttap(opts: { times: number } = { times: 5 }) {
  return function(target, name, descriptor) {
    var tap_times = 0;
    var per_tap_time = 0;
    const source_fun = descriptor.value;
    descriptor.value = function tttttap(...args) {
      const cur_tap_time = Date.now();
      if (cur_tap_time - per_tap_time > 500) {
        // 两次点击的间隔不能多余半秒，否则重置计数
        tap_times = 0;
      }
      per_tap_time = cur_tap_time;
      tap_times += 1;
      if (tap_times === opts.times) {
        return source_fun.apply(this, args);
      }
    };
    descriptor.value.source_fun = source_fun;
    return descriptor;
  };
}

export const asyncCtrlGenerator = {
  tttttap: tttttap,
  queue: queneTask,
  single: singleRunWrap,
  success: asyncSuccessWrapGenerator,
  loading: asyncLoadingWrapGenerator,
  // error: asyncErrorWrapGenerator,
  retry: autoRetryWrapGenerator,
  error(
    error_title?: any,
    opts?: ErrorOptions,
    hidden_when_page_leaved?: boolean,
    keep_throw?: boolean,
  ) {
    return asyncErrorWrapGenerator(
      error_title,
      opts,
      hidden_when_page_leaved,
      keep_throw,
      (params, self: FLP_Tool) => {
        if (!(self instanceof FLP_Tool)) {
          alert(
            (
              params.title +
              "\n" +
              params.subTitle +
              "\n" +
              params.message
            ).trim(),
          );
          throw new TypeError(
            "asyncErrorWrapGenerator must within FLP_TOOL subclass",
          );
        }
        const buttons = params.buttons;
        if (
          buttons &&
          buttons.length == 1 &&
          buttons[0] === getTranslateSync("CONFIRM")
        ) {
          buttons.length = 0;
        }
        return self.showErrorDialog(
          params.title,
          params.subTitle,
          params.message,
          params.buttons,
          false,
        );
      },
    );
  },
  warning(
    error_title?: any,
    opts?:
      | AlertOptions
      | ((self: FLP_Tool) => AlertOptions)
      | ((self: FLP_Tool) => Promise<AlertOptions>),
    hidden_when_page_leaved?: boolean,
    keep_throw?: boolean,
  ) {
    return asyncErrorWrapGenerator(
      error_title,
      opts,
      hidden_when_page_leaved,
      keep_throw,
      (params, self: FLP_Tool) => {
        const buttons = params.buttons;
        if (
          buttons &&
          buttons.length == 1 &&
          buttons[0] === getTranslateSync("CONFIRM")
        ) {
          buttons.length = 0;
        }
        return self.showWarningDialog(
          params.title,
          params.subTitle,
          params.message,
          params.buttons,
          false,
        );
      },
    );
  },
};
