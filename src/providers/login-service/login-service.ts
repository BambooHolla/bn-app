import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import "rxjs/add/operator/map";
import {
  AppSettingProvider,
  TB_AB_Generator,
} from "../app-setting/app-setting";
import { AppFetchProvider, CommonResponseData } from "../app-fetch/app-fetch";
import { Observable, BehaviorSubject } from "rxjs";
import { PromisePro } from "../../bnqkl-framework/PromiseExtends";
import { AsyncBehaviorSubject } from "../../bnqkl-framework/RxExtends";

export type UserModel = {
  name: string;
  telephone: string;
  email: string;
};
@Injectable()
export class LoginServiceProvider {
  loginStatus: Observable<boolean>;
  constructor(
    public http: Http,
    public appSetting: AppSettingProvider,
    public fetch: AppFetchProvider,
  ) {
    console.group("Hello LoginServiceProvider Provider");
    window["LoginServiceProviderInstance"] = this;
    this.loginStatus = this.appSetting.user_token.map(val => {
      console.log("USER TOKEN:", val);
      return !!val;
    });
    console.groupEnd();
  }
  readonly GET_LOGINER_DATA_URL = this.appSetting.APP_URL(
    "user/getCustomersData",
  );
  readonly LOGIN_URL = this.appSetting.APP_URL("user/login");
  readonly CHECK_REG_ACCOUNT_URL = this.appSetting.APP_URL(
    "user/checkRegAccount",
  );
  readonly SEND_SMS_TO_UNRESISTER_URL = this.appSetting.APP_URL(
    "user/sendSmsToAppointed",
  );
  readonly REGISTER_URL = this.appSetting.APP_URL("bnlcbiz/member/create");

  // _loginerInfo: AsyncBehaviorSubject<CommonResponseData<UserModel>>
  // // 按需生成，否则直接生成的话发起请求，在返回的末端没有其它地方接手这个请求catch错误的话，会导致异常抛出到全局
  // get loginerInfo() {
  //   if (!this._loginerInfo) {
  //     this.appSetting.user_token.subscribe(token => {
  //       if (!this._loginerInfo) {
  //         this._loginerInfo = new AsyncBehaviorSubject(promise_pro => {
  //           return promise_pro.follow(this.fetch.get(this.GET_LOGINER_DATA_URL, { search: { type: "1" } }));
  //         });
  //       } else {
  //         this._loginerInfo.refresh();
  //       }
  //     })
  //   }
  //   return this._loginerInfo;
  // }
  loginerInfo: AsyncBehaviorSubject<UserModel>;
  // 按需生成，否则直接生成的话发起请求，在返回的末端没有其它地方接手这个请求catch错误的话，会导致异常抛出到全局
  @TB_AB_Generator("loginerInfo")
  loginerInfo_Executor(promise_pro) {
    return promise_pro.follow(
      this.fetch
        .autoCache(true)
        .get(this.GET_LOGINER_DATA_URL, { search: { type: "1" } }),
    );
  }
  private USER_PWD_STORE_KEY = "IFM_USER_LOGIN_PWD";
  /**
   * 登录账户
   *
   * @param {string} account
   * @param {string} password
   * @param {boolean} [savePwd=true]
   * @returns
   * @memberof LoginServiceProvider
   */
  doLogin(account: string, password: string, savePwd = true) {
    return this.fetch
      .post(
        this.LOGIN_URL,
        {
          type: 1,
          account,
          password,
        },
        void 0,
        true,
      )
      .then(data => {
        // 登录成功自动保存密码
        if (savePwd) {
          localStorage.setItem(this.USER_PWD_STORE_KEY, password);
        }
        console.log("登录成功：", data);
        this.appSetting.setUserToken(data);
        return data;
      });
  }

  /**
   * 检测帐号是否可直接登录
   *
   * @param {string} telephone
   * @returns
   * @memberof LoginServiceProvider
   */
  checkAccountLoginAble(telephone: string) {
    return this.fetch
      .get<any>(
        this.CHECK_REG_ACCOUNT_URL,
        {
          search: { telephone },
        },
        true,
      )
      .then(data => {
        console.log("check res account", data);
        if (data.status === "error") {
          return false;
        } else {
          return true;
        }
      });
  }

  /**
   * 发送注册账户用的验证码
   *
   * @param {string} telephone
   * @returns
   * @memberof LoginServiceProvider
   */
  sendSms(telephone: string) {
    return this.fetch.get(this.SEND_SMS_TO_UNRESISTER_URL, {
      search: { telephone },
    });
  }

  registerAccount(
    account: string,
    password: string,
    code: string,
    recommendCode?: string,
    savePwd = true,
  ) {
    return this.fetch
      .post(this.REGISTER_URL, {
        phoneNo: account,
        password,
        code,
        recommendCode,
      })
      .then(data => {
        console.log("注册成功：", data);
        return this.doLogin(account, password);
      });
  }
  loginOut() {
    this.appSetting.clearUserToken();
    return this.loginerInfo.toPromise();
  }
}
