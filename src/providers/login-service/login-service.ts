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
import { Observable, BehaviorSubject, Subscription } from "rxjs";
import { PromisePro } from "../../bnqkl-framework/PromiseExtends";
import { AsyncBehaviorSubject } from "../../bnqkl-framework/RxExtends";
import {
  FLP_Tool,
  tryRegisterGlobal,
} from "../../../src/bnqkl-framework/FLP_Tool";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { AlertController } from "ionic-angular/index";
import { AccountServiceProvider } from "../account-service/account-service";
import { UserInfoProvider } from "../user-info/user-info";

@Injectable()
export class LoginServiceProvider extends FLP_Tool {
  loginStatus: Observable<boolean>;
  get keypair() { return AppSettingProvider.IFMJSCORE.keypair() };
  /**用于生成随机语句 */
  get Mnemonic() { return AppSettingProvider.IFMJSCORE.keypair().Mnemonic }
  get addressCheck() { return AppSettingProvider.IFMJSCORE.address() }
  constructor(
    public http: Http,
    public appSetting: AppSettingProvider,
    public fetch: AppFetchProvider,
    public storage: Storage,
    public alertController: AlertController,
    public translateService: TranslateService,
    public accountService: AccountServiceProvider,
    public user: UserInfoProvider
  ) {
    super();
    tryRegisterGlobal("loginService", this);
    this.loginStatus = this.appSetting.user_token.map(val => {
      // console.log("USER TOKEN:", val);
      return !!val;
    });

    // 当登录的用户发生变化的时候，安装用户数据更新
    this.appSetting.user_token.map(val => val && val.address).distinctUntilChanged().subscribe(v => {
      if (v) {
        this.installUserInfoRefresher();
      } else {
        this.unInstallUserInfoRefresher();
      }
    });
  }
  private _user_info_refresher?: Subscription;
  installUserInfoRefresher() {
    if (this._user_info_refresher) {
      this._user_info_refresher.unsubscribe();
    }
    // 高度发生变动的时候，更新用户信息
    this._user_info_refresher = this.appSetting.height.subscribe(
      this.refreshUserInfo.bind(this)
    );
  }
  unInstallUserInfoRefresher() {
    if (this._user_info_refresher) {
      this._user_info_refresher.unsubscribe();
      this._user_info_refresher = undefined;
    }
  }

  /** 更新用户信息
   */
  @asyncCtrlGenerator.retry(undefined, err =>
    console.error("获取用户信息一直失败，需要检查网络", err)
  )
  async refreshUserInfo() {
    await this.netWorkConnection();
    const userinfo = this.appSetting.getUserToken();
    if (!userinfo) {
      return;
    }
    const res = await this.fetch
      .forceNetwork(this.fetch.onLine)
      .get<any>(this.SEARCH_ACCOUNT_URL, {
        search: {
          address: userinfo.address,
        },
      });
    this.user.is_from_network = true;
    // Object.assign(userinfo, res.account);
    this.appSetting.setUserToken(res.account);
  }
  readonly LOGIN_URL = this.appSetting.APP_URL("/api/accounts/open");
  readonly SEARCH_ACCOUNT_URL = this.appSetting.APP_URL("/api/accounts/");
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
    // 这里的登录不再请求服务器，而是直接返回空的账户数据，等进入到页面后再去同步账户数据
    if (this.checkAccountLoginAble(password)) {
      const publicKey = this.keypair.create(password);
      const address = this.addressCheck.generateAddress(publicKey);
      FLP_Tool.netWorkConnection().then(async () => {
        var fail = true;
        do {
          try {
            // 发送一个开账户的请求，确保这个账户在服务端是有的
            await this.fetch.put(this.LOGIN_URL, { publicKey });
            fail = false;
          } catch (err) {
            console.warn("账户开通失败", err);
          }
        } while (fail);
      });

      const oldData = this.appSetting.getUserToken();

      let loginObj: any = {
        password: savePwd ? password : "",
        remember: savePwd,
        address,
        publicKey,
      };
      if (oldData && oldData.address == address) {
        loginObj = {
          ...oldData,
          ...loginObj,
        };
      } else {
        loginObj = {
          ...loginObj,
          unconfirmedBalance: "0",
          balance: "0",
          unconfirmedSignature: 0,
          secondSignature: 0,
          multisignatures: [],
          u_multisignatures: [],
          isOnwer: false,
          paidFee: "0",
          votingReward: "0",
          forgingReward: "0",
          isDelegate: 0,
        };
      }

      {
        // 以Token的形式保存用户登录信息，用于自动登录
        const { password, savePwd, ...safe_data } = loginObj;
        // 初始的数据并不是来自网络
        this.user.is_from_network = true;
        this.appSetting.setUserToken(loginObj);
        return safe_data;
      }
    } else {
      let alert = this.alertController.create({
        title: "error",
        subTitle: "Your passphrase is incorrect.",
        buttons: ["CONFIRM"],
      });
      alert.present();
      return false;
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
    // return this.ifmJs.Mnemonic.isValid(password);
    return true;
  }

  /**
   * 创建一个新的账号，根据当前语言获得不同的主密码语言
   *
   */
  generateNewPassphrase(params: {
    phone?: string;
    email?: string;
    mark?: string;
    pwd?: string;
  }, currentLang = this.translateService.currentLang) {
    if (currentLang.indexOf("zh-") === 0) {
      return this.accountService.generateCryptoPassword(params, "cn");
    } else {
      return this.accountService.generateCryptoPassword(params, "en");
    }
  }

  loginOut() {
    this.appSetting.clearUserToken();
    // return this.loginerInfo.toPromise();
  }
}
