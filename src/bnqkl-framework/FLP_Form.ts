import { FLP_Route } from "./FLP_Route";
import { UserInfoProvider } from "../providers/user-info/user-info";
export class FLP_Form extends FLP_Route {
  private __ecc__: { [prop_name: string]: string[] };
  private get _error_checks_col() {
    return this.__ecc__ || (this.__ecc__ = {});
  }
  formData: any = {};
  /**
   * 校验用的错误收集器
   * @param namespalce 目标字段
   * @param key 字段属性
   */
  static setErrorTo(namespace: string, key: string, error_keys: string[]) {
    return (target: any, name: string, descriptor?: PropertyDescriptor) => {
      const error_checks_col = target._error_checks_col;
      if (!(key in error_checks_col)) {
        error_checks_col[key] = [];
      }
      error_checks_col[key].push(name);

      const source_fun = descriptor.value;
      descriptor.value = function(...args) {
        const res = source_fun.apply(this, args);
        const bind_errors = _err_map => {
          const all_errors = this[namespace] || (this[namespace] = {});
          const current_error = all_errors[key] || {};
          const err_map = _err_map || {};

          error_keys.forEach(err_key => {
            if (err_key in err_map) {
              current_error[err_key] = err_map[err_key];
            } else {
              delete current_error[err_key];
            }
          });
          if (Object.keys(current_error).length) {
            all_errors[key] = current_error;
          } else {
            delete all_errors[key];
          }
          return _err_map;
        };
        if (res instanceof Promise) {
          return res.then(bind_errors);
        } else {
          return bind_errors(res);
        }
      };
      descriptor.value.source_fun = source_fun;
      return descriptor;
    };
  }
  errors: any = {};
  hasError(errors = this.errors) {
    return !!Object.keys(errors).length;
  }
  protected allHaveValues(obj) {
    for (let k in obj) {
      if (!obj[k]) {
        return false;
      }
    }
    return true;
  }

  get canSubmit() {
    return (
      !this.hasError(this.errors) &&
      Object.keys(this.formData).every(k => this.formData[k])
    );
  }

  // 输入框收集器
  inputstatus = {};
  setInputstatus(formKey: string, e) {
    this.inputstatus[formKey] = e.type;
    if (e.type === "input") {
      this.checkFormKey(formKey);
    }
    this.event.emit("input-status-changed", {
      key: formKey,
      event: e,
    });
  }
  checkFormKey(formKey: string) {
    if (this._error_checks_col[formKey]) {
      this._error_checks_col[formKey].forEach(fun_key => {
        try {
          this[fun_key]();
        } catch (err) {
          console.warn("表单检查出错", fun_key, err);
        }
      });
    }
  }

  /*要求用户输入支付密码*/
  @FLP_Form.FromGlobal userInfo: UserInfoProvider;
  async getUserPassword(
    opts: {
      /**是否需要二次密码*/
      seconed_pwd?: boolean;
    } = {},
  ) {
    // // 登录密码
    // const password = this.userInfo.password;
    // 支付密码
    const pwdData = new Promise((resolve, reject) => {
      try {
        const model = this.modalCtrl.create("pwd-input", opts,{
          // enableBackdropDismiss: true
        });
        model.present();
        model.onDidDismiss(data => {
          resolve(data);
        });
      } catch (err) {
        reject(err);
      }
    });
    console.log(pwdData);
    return pwdData;
  }
}
