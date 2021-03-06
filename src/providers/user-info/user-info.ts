import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Storage } from "@ionic/storage";
import EventEmitter from "eventemitter3";
import { FLP_Tool } from "../../bnqkl-framework/FLP_Tool";

@Injectable()
// 用户缓存用户的基本信息，相比getUserToken，速度更快
export class UserInfoProvider extends EventEmitter {
  @FLP_Tool.FromGlobal appSetting!: import("../app-setting/app-setting").AppSettingProvider;
  get in_stealth_mode() {
    return this.isDelegate ? this.appSetting.settings.delegate_in_stealth_mode : this.appSetting.settings.in_stealth_mode;
  }
  set in_stealth_mode(v) {
    if (this.isDelegate) {
      this.appSetting.settings.delegate_in_stealth_mode = v;
    } else {
      this.appSetting.settings.in_stealth_mode = v;
    }
  }

  private _userInfo: any;
  get userInfo() {
    return this._userInfo || {};
  }
  private _publicKey!: string;
  get publicKey() {
    return this._publicKey;
  }
  private _balance!: string;
  get balance() {
    return this._balance;
  }
  ibtToUSD(ibt: number) {
    return ibt * 50 || 0;
  }
  get usd() {
    return this.ibtToUSD(parseFloat(this.balance));
  }
  get dollar() {
    return this.usd;
  }
  private _address!: string;
  get address() {
    return this._address;
  }
  private _password!: string;
  get password() {
    return this._password;
  }
  private _secondPublicKey!: string;
  get secondPublicKey() {
    return this._secondPublicKey;
  }
  get hasSecondPwd() {
    return !!this._userInfo.secondPublicKey;
  }
  private _username!: string;
  get username() {
    return this._username;
  }
  private _accountType!: number;
  get accountType() {
    return this._accountType;
  }
  get isFreezed() {
    return this._accountType === 1;
  }
  get isDelegate() {
    return !!this._userInfo.isDelegate;
  }
  get votingReward() {
    return this._userInfo.votingReward;
  }
  get paidFee() {
    return this._userInfo.paidFee;
  }

  get miningReward() {
    return (parseFloat(this._userInfo.votingReward) || 0) + (parseFloat(this._userInfo.forgingReward) || 0);
  }

  constructor(public storage: Storage) {
    super();
  }
  TA_address = "";
  /*数据是否来自网络*/
  is_from_network = false;
  initUserInfo(userInfo) {
    if (!userInfo) {
      userInfo = {};
    }
    this._userInfo = userInfo;
    this._accountType = userInfo.accountType || 0;
    // if (this._address !== userInfo.address) {
    //   this._password = "";
    // }
    this._address = userInfo.address;
    this._balance = userInfo.balance;
    this._secondPublicKey = userInfo.secondPublicKey;
    this._publicKey = userInfo.publicKey;
    this._username = userInfo.username;
    // if ("password" in userInfo) {
    this._password = userInfo.remember ? userInfo.password : "";
    // }
    this.emit("changed");
  }
}
