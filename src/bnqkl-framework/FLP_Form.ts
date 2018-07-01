import { FLP_Route } from "./FLP_Route";
import { FLP_Tool } from "./FLP_Tool";
import {
  NavController,
  NavOptions,
  NavParams,
  ViewController,
} from "ionic-angular";
import { getErrorFromAsyncerror, translateMessage } from "./Decorator";
import { UserInfoProvider } from "../providers/user-info/user-info";
import { AppSettingProvider } from "../providers/app-setting/app-setting";
import { asyncCtrlGenerator } from "./Decorator";

export class FLP_Form extends FLP_Route {
  constructor(public navCtrl: NavController, public navParams: NavParams) {
    super(navCtrl, navParams);
    this.trySubmit = this.trySubmit.bind(this);
  }
  private __ecc__?: { [prop_name: string]: string[] };
  private get _error_checks_col() {
    return this.__ecc__ || (this.__ecc__ = {});
  }
  formData: any = {};
  /**
   * 校验用的错误收集器
   * @param namespalce 目标字段
   * @param key 字段属性
   */
  static setErrorTo(
    namespace: string,
    key: string,
    error_keys: string[],
    extends_opts: {
      check_when_empty?: boolean;
      formData_key?: string;
    } = {},
  ) {
    const formData_key = extends_opts.formData_key || "formData";
    return (target: any, name: string, descriptor: PropertyDescriptor) => {
      const error_checks_col = target._error_checks_col;
      if (!(key in error_checks_col)) {
        error_checks_col[key] = [];
      }
      error_checks_col[key].push(name);

      const source_fun = descriptor.value;
      descriptor.value = function(...args) {
        var res;
        if (!extends_opts.check_when_empty && !this[formData_key][key]) {
          // ignore check
        } else {
          res = source_fun.apply(this, args);
        }
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
          if (this.cdRef) {
            this.cdRef.markForCheck();
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
    for (var k in errors) {
      return true;
    }
    return false;
  }
  protected allHaveValues(obj) {
    for (var k in obj) {
      if (!obj[k]) {
        return false;
      }
    }
    return true;
  }

  @FLP_Form.didEnter
  _preCheckWhenShowPage() {
    const error_checks_col = this._error_checks_col;
    Object.keys(this.formData).forEach(key => {
      if (error_checks_col[key] instanceof Array) {
        const val = this.formData[key];
        if (val !== "" || val !== undefined) {
          error_checks_col[key].forEach(method_name => {
            this[method_name]();
          });
        }
      }
    });
  }

  ignore_keys: string[] = [];
  get canSubmit() {
    return (
      !this.hasError(this.errors) &&
      Object.keys(this.formData).every(k => {
        return (
          this.ignore_keys.indexOf(k) !== -1 ||
          this.formData[k] ||
          typeof this.formData[k] === "boolean"
        );
      })
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

  resetFormData() {
    for (var key in this.formData) {
      if (typeof this.formData[key] === "string") {
        this.formData[key] = "";
      } /*else if(typeof this.formData[key]==="number"){
        this.formData[key] = 0
      }*/
    }
  }

  /*要求用户输入支付密码*/
  @FLP_Form.FromGlobal userInfo!: UserInfoProvider;
  @FLP_Form.FromGlobal appSetting!: AppSettingProvider;

  @asyncCtrlGenerator.error(
    () => FLP_Form.getTranslate("PAY_INPUT_ERROR"),
    undefined,
    undefined,
    true,
  )
  async getUserPassword(
    opts: {
      title?: string;
      custom_fee?: boolean;
      /**是否一定要输入主密码*/
      force_require_password?: boolean;
    } = {},
  ): Promise<{
    password: string;
    have_password?: boolean;
    pay_pwd?: string;
    need_pay_pwd?: boolean;
    need_custom_fee?: boolean;
    custom_fee?: number;
  }> {
    const { force_require_password, custom_fee } = opts;
    if (!force_require_password && !custom_fee) {
      // 登录密码
      const { password, hasSecondPwd } = this.userInfo;
      if (!hasSecondPwd && password) {
        return { password };
      }
    }
    // 支付密码
    return new Promise<{ password; pay_pwd }>((resolve, reject) => {
      try {
        const model = (this as FLP_Tool).modalCtrl.create("pwd-input", opts, {
          enableBackdropDismiss: true,
          cssClass: "pwd-input-modal",
          showBackdrop: true,
        });
        model.present();
        model.onDidDismiss(data => {
          if (data) {
            resolve(data);
          } else {
            console.warn(new Error(this.getTranslateSync("PAY_INPUT_CANCEL")));
            reject(getErrorFromAsyncerror(false));
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async getCustomFee(current_fee?: number) {
    return new Promise<{ custom_fee: number }>((resolve, reject) => {
      try {
        const model = this.modalCtrl.create(
          "fee-input",
          { current_fee },
          {
            enableBackdropDismiss: true,
            cssClass: "fee-input-modal",
            showBackdrop: true,
          },
        );
        model.present();
        model.onDidDismiss(data => {
          if (data) {
            resolve(data);
          } else {
            if (current_fee && isFinite(current_fee)) {
              resolve({ custom_fee: current_fee }); //返回默认值
            } else {
              console.warn(
                new Error(this.getTranslateSync("FEE_INPUT_CANCEL")),
              );
              reject(getErrorFromAsyncerror(false));
            }
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }
  formDataKeyI18nMap: any = {};

  async trySubmit() {
    // 先找有对应翻译的错误
    const has_error = this.hasError();
    if (has_error) {
      for (var err_key in this.errors) {
        const errors = this.errors[err_key];
        for (var err_message_key in errors) {
          const err_message = errors[err_message_key];
          if (typeof err_message === "string") {
            return err_message;
          }
        }
      }
    }
    // 找空的字段
    if (!this.canSubmit) {
      for (var form_key in this.formData) {
        if (
          !(
            this.ignore_keys.indexOf(form_key) !== -1 ||
            this.formData[form_key] ||
            typeof this.formData[form_key] === "boolean"
          )
        ) {
          return this.getTranslateSync("NEED_INPUT_#FORM_KEY#", {
            form_key: await translateMessage(
              this.formDataKeyI18nMap[form_key] || form_key,
            ),
          });
        }
      }
    }

    return has_error;
  }
}
