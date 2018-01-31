import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AppSettingProvider } from "../app-setting/app-setting";
import { AppFetchProvider, CommonResponseData } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { TransactionServiceProvider } from "../transaction-service/transaction-service";
import { Storage } from "@ionic/storage";
import { UserInfoProvider } from "../user-info/user-info";
import * as TYPE from "./account.types";
import { Observable, BehaviorSubject } from "rxjs";
import * as IFM from "ifmchain-ibt";

// TODO：接入Token管理，将用户相关的数据使用内存进行缓存。改进用户相关的数据请求。@Gaubee
@Injectable()
export class AccountServiceProvider {
  ifmJs = AppSettingProvider.IFMJS;
  Mnemonic = this.ifmJs.Mnemonic;
  account = AppSettingProvider.IFMJS.Api(AppSettingProvider.HTTP_PROVIDER)
    .account;
  transactionType = this.ifmJs.transactionTypes;
  nacl_factory = this.ifmJs.nacl_factory;
  Buff = this.ifmJs.Buff;
  keypair = this.ifmJs.keypairHelper;
  Crypto = this.ifmJs.crypto;
  md5: any;
  sha: any;
  nacl: any;
  constructor(
    public http: HttpClient,
    public translateService: TranslateService,
    public storage: Storage,
    public appSetting: AppSettingProvider,
    public fetch: AppFetchProvider,
    public transactionService: TransactionServiceProvider,
    public user: UserInfoProvider,
  ) {
    this.md5 = this.Crypto.createHash("md5"); //Crypto.createHash('md5');
    this.sha = this.Crypto.createHash("sha256"); //Crypto.createHash('sha256');
  }

  readonly GET_USER = this.appSetting.APP_URL("/api/accounts/");
  readonly GET_USER_BY_USERNAME = this.appSetting.APP_URL(
    "/api/accounts/username/get",
  );

  /**
   * 根据地址获取账户信息
   * @param {string} address
   * @returns {Promise<any>}
   */
  async getAccountByAddress(address: string): Promise<TYPE.userModel> {
    let data = await this.fetch.get<any>(this.GET_USER, {
      search: {
        address: address,
      },
    });
    return data.account;
  }

  /**
   * 根据用户名获取账户信息
   * @param {string} username
   * @returns {Promise<any>}
   */
  async getAccountByUsername(username: string): Promise<TYPE.userModel> {
    let data = await this.fetch.get<any>(this.GET_USER_BY_USERNAME, {
      search: {
        username: username,
      },
    });

    return data.account;
  }

  /**
   *  更改用户名
   *  @param {string} newUsername
   */
  async changeUsername(newUsername: string, secret: string, secondSecret ?: string) {
    if (!!this.user.userInfo.username) {
      throw "account already has username";
    } else {
      let accountUsername = await this.getAccountByUsername(newUsername);
      if (!!accountUsername) {
        let accountData = {
          type: "username",
          secret: this.user.userInfo.secret,
          publicKey: this.user.userInfo.publicKey,
          fee: this.appSetting.settings.default_fee,
          asset: {
            username: {
              alias: newUsername,
              publicKey: this.user.userInfo.publicKey,
            },
          },
          secondSecret
        }

        if(secondSecret) {
          accountData.secondSecret = secondSecret;
        }

        let is_success = await this.transactionService.putTransaction(
          accountData,
        );
        if (is_success) {
          this.user.userInfo.username = newUsername;
          return true;
        } else {
          throw new Error("Change username error");
        }
      } else {
        throw new Error("This username has already exist");
      }
    }
  }

  /**
   * 生成密码
   * @param options 传入的选项，都没有的话返回纯粹的生成密码
   * @param lang 默认语言
   */
  generateCryptoPassword(options: object, lang: string) {
    let password = this.keypair.generatePassPhraseWithInfo(options, lang);

    return password;
  }

  /**
   * 设置支付密码
   * @param {string} secondScret
   */
  async setSecondPassphrase(
    password: string,
    secondSecret: string,
    second?: string,
  ) {
    debugger;
    let txData = {
      type: this.transactionType.SIGNATURE,
      asset: {
        signature: {
          publicKey: this.user.userInfo.publicKey,
        },
      },
      amount: "0",
      secret: password,
      secondSecret: secondSecret,
      publicKey:this.user.publicKey,
      fee: this.appSetting.settings.default_fee.toString(),
    };

    let is_success = await this.transactionService.putTransaction(txData);
    if (is_success) {
      return true;
    } else {
      throw new Error("Set second passphrase error");
    }
  }
  

}
