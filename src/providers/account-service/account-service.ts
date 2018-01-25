import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
  AppSettingProvider
} from "../app-setting/app-setting";
import { AppFetchProvider, CommonResponseData } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { TransactionServiceProvider } from "../transaction-service/transaction-service";
import { Storage } from "@ionic/storage";

var Crypto = {} as any;// = require("crypto");
var nacl_factory = {} as any;// = require("js-nacl");
var Buff = {} as any;// = require("buffer/").Buffer;
import { Observable, BehaviorSubject } from "rxjs";
import * as IFM from 'ifmchain-ibt';


@Injectable()
export class AccountServiceProvider {
  ifmJs: any;
  Mnemonic: any;
  account: any;
  userInfo: any;
  md5: any;
  sha: any;
  nacl: any;
  constructor(
    public http: HttpClient,
    public translateService: TranslateService,
    public storage : Storage,
    public appSetting: AppSettingProvider,
    public fetch: AppFetchProvider,
    public transactionService: TransactionServiceProvider,
  ) {
    this.ifmJs = AppSettingProvider.IFMJS;
    this.account = AppSettingProvider.IFMJS.Api(AppSettingProvider.HTTP_PROVIDER).account;
    this.Mnemonic = this.ifmJs.Mnemonic;
    this.md5 = Crypto.createHash('md5');
    this.sha = Crypto.createHash('sha256');
    //console.log(this.md5.update('11111').digest('hex'));
  }

  /**
   * 根据地址获取账户信息
   * @param {string} address
   * @returns {Promise<any>}
   */
  async getAccountByAddress(address: string) {
    let data = await this.account.getUserByAddress(address);
    if(data.success) {
      return data;
    }else {
      return {};
    }
  }

  /**
   * 根据用户名获取账户信息
   * @param {string} username
   * @returns {Promise<any>}
   */
  async getAccountByUsername(username: string) {
    let data = await this.account.getUserByUsername(username);

    if(data.success && data.account.address) {
      return data.account;
    }else {
      return false;
    }
  }

  /**
   *  更改用户名
   *  @param {string} newUsername 更换用户名
   */
  async changeUsername(newUsername: string, secret ?: string) {
    if(!!this.userInfo.username) {
      throw "account already has username";
    }else {
      let accountUsername = await this.getAccountByUsername(newUsername);
      if(!!accountUsername) {
        let accountData = {
          type: "username",
          secret: this.userInfo.secret,
          publicKey: this.userInfo.publicKey,
          fee: this.userInfo.fee,
          asset: {
            username: {
              alias: newUsername,
              publicKey: this.userInfo.publicKey
            }
          }
        }

        let is_success = await this.transactionService.putTransaction(accountData);
        if (is_success) {
          this.userInfo.username = newUsername;
        }
      }
    }
  }

  async getUserSettingLocal(address: string) {

  }

  async saveUserSettingLocal(userData: object) {

  }

  //生成密码
  generateCryptoPassword(options : object, lang : string) {
    let password = '', cryptoOptStr = '';
    //只有带有options时才生成
    if(Object.keys(options).length > 0) {
      let optionStr = '';
      for(let i in options) {
        optionStr += options[i];
      }
      cryptoOptStr = this.md5.update(optionStr).digest('hex');
      cryptoOptStr += '@';
    }

    //生成密码
    if(lang === 'en') {
      password = new this.Mnemonic(256, this.Mnemonic.Words.ENGLISH)['phrase'];
    }else {
      password = new this.Mnemonic(256, this.Mnemonic.Words.CHINESE)['phrase'];
    }

    //如果包含@则是带有options的密码
    return cryptoOptStr + password;
  }

  //验证支付密码
  verifySecondPassphrase(secondPassphrase: string) {
    try {
      let secondPublic = this.formatSecondPassphrase(this.userInfo.publicKey, secondPassphrase);
      console.log(secondPublic.publicKey.toString('hex'));
      if(secondPublic.publicKey.toString('hex') === this.userInfo.secondPublicKey) {
        return true;
      }else {
        return false;
      }
    }catch(e) {
      console.log("Failed to verify");
    }
  }

  /**
   * 将输入的支付密码转换为publicKey
   * @param publicKey
   * @param secondSecret
   * @returns {any}
   */
  formatSecondPassphrase(publicKey, secondSecret) {
    debugger
    //设置
    if(!this.nacl) {
      nacl_factory.instantiate(function(tmpNacl) {
        this.nacl = tmpNacl;
      })
    }

    let reg = /^[^\s]+$/;
    if(!reg.test(secondSecret)) {
      throw "Second Secret cannot contain spaces";
    }

    let pattern = /^[^\u4e00-\u9fa5]+$/;
    if(!pattern.test(secondSecret)) {
      throw "Second Secret cannot contain Chinese characters";
    }

    let md5Second = publicKey.toString().trim() + '-' + this.md5.update(secondSecret.toString().trim()).digest('hex');
    let secondHash = this.sha.update(md5Second, 'utf-8').digest();
    let secondKeypair = this.nacl.crypto_sign_seed_keypair(secondHash);
    secondKeypair.publicKey = Buff.from(secondKeypair.signPK);
    secondKeypair.privateKey = Buff.from(secondKeypair.signSK);
    return secondKeypair;
  }

  transactionType = this.ifmJs.transactionTypes// By Gaubee
  /**
   * 设置支付密码
   * @param {string} secondScret
   */
  async setSecondPassphrase(secondSecret: string, second ?: string) {
    debugger
    let txData = {
      "type" : this.transactionType.SIGNATURE,
      "asset" : {
        signature: {
          publicKey: this.userInfo.publicKey
        }
      },
      "amount" : "0",
      "secret" : "decorate soap volcano lizard original leaf evolve vibrant protect maple enough together weapon erase orphan eye blue spoil verb more credit garbage barrel age",
      "secondSecret" : secondSecret,
      "publicKey" : "38e70075fc1054bfbb29cb550932a719f88c1c34f2ed897f1ae74a328ab9a21e",
      "fee" : "0.00000001"
    }

    let is_success = await this.transactionService.putTransaction(txData);
    if(is_success) {
      console.log("secondSign set successfully");
    }
  }

}
