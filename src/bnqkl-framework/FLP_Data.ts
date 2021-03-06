import { FLP_MatForm } from "./FLP_MatForm";
import { PAGE_STATUS } from "./const";
import { AniBase } from "../components/AniBase";
export class FLP_Data extends FLP_MatForm {
  /** 定义一个延迟渲染到页面的属性
   */
  static setAfterPageEnter(defaultValue?: any, delay?: number) {
    return function(
      target: any,
      name: string,
      descriptor?: PropertyDescriptor
    ) {
      if (!descriptor) {
        let cache_data = defaultValue;
        let val;
        let is_bind_event = false;
        let can_set = true;
        let can_set_cb: Function;

        target.event.on("willEnter", () => {
          val = cache_data = defaultValue;
          if (delay && isFinite(delay)) {
            can_set = false;
            setTimeout(() => {
              can_set = true;
              if (can_set_cb instanceof Function) {
                can_set_cb();
              }
            }, delay);
          }
        });
        const setVal = () => {
          if (can_set) {
            val = cache_data;
          } else {
            can_set_cb = () => (val = cache_data);
          }
        };
        descriptor = {
          enumerable: true,
          configurable: true,
          get() {
            return val;
          },
          set(v) {
            cache_data = v;
            if (this.PAGE_STATUS === PAGE_STATUS.WILL_ENTER) {
              if (!is_bind_event) {
                is_bind_event = true;
                this.event.once("didEnter", setVal);
                this.event.once("didLeave", () => {
                  is_bind_event = false;
                });
              }
            } else {
              setVal();
            }
          },
        };
        Object.defineProperty(target, name, descriptor);
      }
    };
  }

  /*一个动态跳动的数字*/
  static aniNumberProp(opts: {
    duration: number;
    easing?: any;
    floor?: boolean;
  }) {
    return function(target, name, descriptor?: PropertyDescriptor) {
      if (!descriptor) {
        let ani_val = 0;
        let target_val = 0;
        let ti_aborter;
        descriptor = {
          enumerable: true,
          configurable: true,
          get() {
            return ani_val;
          },
          set(v: number) {
            if (target_val === v) {
              return;
            }
            if (ti_aborter) {
              ti_aborter();
              ti_aborter = undefined;
            }
            target_val = v;
            AniBase.animateNumber(
              ani_val,
              target_val,
              opts.duration,
              opts.easing
            )(
              (v, abort) => {
                const new_val = opts.floor ? Math.floor(v) : v;
                if (opts.floor) {
                  ani_val = Math.floor(v);
                } else {
                  ani_val = v;
                }
                if (ani_val !== new_val) {
                  ani_val = new_val;
                  this.detectChanges();
                }
                ti_aborter = abort;
              },
              () => {
                ti_aborter = undefined;
              }
            );
          },
        };
        Object.defineProperty(target, name, descriptor);
      }
    };
  }

  timeago_clock = 0;
  enable_timeago_clock = false;
  @FLP_Data.willEnter
  refreshShowList() {
    if (
      this.PAGE_STATUS <= PAGE_STATUS.DID_ENTER &&
      this.enable_timeago_clock
    ) {
      // this.show_list = this.roll_out_logs.slice();
      if (this.timeago_clock) {
        this.timeago_clock = 0;
      } else {
        this.timeago_clock = 0.000001;
      }
      this.detectChanges();
      setTimeout(this.refreshShowList.bind(this), 1000);
    }
  }

  mixArrayByUnshift<T>(
    target_list: T[],
    sub_list: T[],
    opts: {
      mix_key: string;
    }
  ) {
    const first_ele = target_list[0];
    if (!first_ele) {
      return target_list.concat(sub_list);
    }
    const end_index = sub_list.findIndex(
      item => item[opts.mix_key] === first_ele[opts.mix_key]
    );
    if (end_index === -1) {
      return sub_list.concat(target_list);
    } else {
      return sub_list.slice(0, end_index).concat(target_list);
    }
  }
  mixArrayByPush<T>(
    target_list: T[],
    sub_list: T[],
    opts: {
      mix_key: string;
    }
  ) {
    const last_ele = target_list[target_list.length - 1];
    if (!last_ele) {
      return target_list.concat(sub_list);
    }
    const end_index = sub_list.findIndex(
      item => item[opts.mix_key] === last_ele[opts.mix_key]
    );
    if (end_index === -1) {
      return target_list.concat(sub_list);
    } else {
      return target_list.concat(sub_list.slice(end_index + 1));
    }
  }
}
