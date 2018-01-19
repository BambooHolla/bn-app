import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import "rxjs/add/operator/map";
import {
  AppSettingProvider,
  TB_AB_Generator,
} from "../app-setting/app-setting";
import { AppFetchProvider, CommonResponseData } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject } from "rxjs";
import { PromisePro } from "../../bnqkl-framework/PromiseExtends";
import { AsyncBehaviorSubject } from "../../bnqkl-framework/RxExtends";
import { AlertController } from "ionic-angular";
import  * as IFM from 'ifmchain-ibt';

export type UserModel = {
  name: string;
  telephone: string;
  email: string;
};
@Injectable()
export class LoginServiceProvider {
  loginStatus: Observable<boolean>;
  ifmJs : any;
  Mnemonic: any;
  constructor(
    public http: Http,
    public appSetting: AppSettingProvider,
    public fetch: AppFetchProvider,
    public storage: Storage,
    public alertController: AlertController,
    public translateService : TranslateService,
  ) {
    console.group("Hello LoginServiceProvider Provider");
    window["LoginServiceProviderInstance"] = this;
    this.loginStatus = this.appSetting.user_token.map(val => {
      console.log("USER TOKEN:", val);
      return !!val;
    });
    this.ifmJs = IFM(AppSettingProvider.NET_VERSION);
    //用于生成随机语句
    this.Mnemonic = this.ifmJs.Mnemonic;
    console.groupEnd();
  }
  readonly LOGIN_URL = this.appSetting.APP_URL("/api/accounts/open");
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
        .get(this.LOGIN_URL, { search: { type: "1" } }),
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
  async doLogin(password: string, savePwd = true) {
    if(this.checkAccountLoginAble(password)) {
      let keypair = this.ifmJs.keypairHelper.create(password);
      let req = {
        "publicKey": keypair.publicKey.toString('hex')
      }

      let data = await this.fetch.put<any>(this.LOGIN_URL, req);
      let loginObj = {
        password,
        "publicKey" : data.account.publicKey,
        "address" : data.account.address,
        "username" : data.account.username || "",
        "balance" : data.account.balance,
        "remember" : savePwd,
        "secondPublickey" : data.account.secondPublicKey ? data.account.secondPublicKey : ""
      }
      await this.storage.set(data.account.address, loginObj);
      localStorage.setItem("address", data.account.address);
      this.appSetting.setUserToken(loginObj);
      return data;
    }else {
      let alert = this.alertController.create({
        title: 'error',
        subTitle: 'Your passphrase is incorrect.',
        buttons: ['OK']
      })
      alert.present();
      return false;
    }
  }

  /**
   * 获取最新登录的账号
   */
  async getRecentAccount() {
    let address = localStorage.getItem("address");

    let accountInfo = await this.storage.get(address);
    if(accountInfo && accountInfo.remember) {
      return accountInfo.password;
    }
  }

  /**
   * 检测帐号是否可直接登录
   *
   * @param {string} password
   * @returns
   * @memberof LoginServiceProvider
   */
  checkAccountLoginAble(password: string) {
    return this.ifmJs.Mnemonic.isValid(password);
  }

  /**
   * 创建一个新的账号，根据当前语言获得不同的主密码语言
   *
   */
  generateNewPassphrase() {
      return new this.Mnemonic(256, this.Mnemonic.Words.ENGLISH)['phrase'];
  }

  // registerAccount(
  //   account: string,
  //   password: string,
  //   code: string,
  //   recommendCode?: string,
  //   savePwd = true,
  // ) {
  //   return this.fetch
  //     .post(this.REGISTER_URL, {
  //       phoneNo: account,
  //       password,
  //       code,
  //       recommendCode,
  //     })
  //     .then(data => {
  //       // console.log("注册成功：", data);
  //       return this.doLogin(account, password);
  //     });
  // }
  loginOut() {
    this.appSetting.clearUserToken();
    return this.loginerInfo.toPromise();
  }
}
