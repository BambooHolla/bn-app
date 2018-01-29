import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Storage } from "@ionic/storage";

@Injectable()
// 用户缓存用户的基本信息，相比getUserToken，速度更快
export class UserInfoProvider {
  private _userInfo: any;
  get userInfo() {
    return this._userInfo;
  }
  // userSettings: any;
  private _fee: string;
  get fee() {
    return this._fee;
  }
  private _balance: string;
  get balance() {
    return this._balance;
  }
  private _address: string;
  get address() {
    return this._address;
  }
  private _password: string;
  get password() {
    return this._password;
  }
  constructor(public storage: Storage) {}
  initUserInfo(userInfo) {
    if (!userInfo) {
      userInfo = {};
    }
    this._userInfo = userInfo;
    this._address = userInfo.address;
    this._fee = userInfo.fee;
    this._balance = userInfo.balance;
    this._password = userInfo.remember ? userInfo.password : null;
  }

  // /**
  //  * 获取用户信息
  //  * @param address
  //  */
  // async getUserSettingLocal(address = this.address) {
  //   if (!address) {
  //     return address;
  //   }
  //   let userStr: any = this.storage.get(address);
  //   try {
  //     let user = JSON.parse(userStr);
  //     this.userInfo = user;
  //     this.address = user.address;
  //     this.fee = user.fee;
  //     this.balance = user.balance;
  //     return user;
  //   } catch (err) {
  //     console.error(err);
  //     return {};
  //   }
  // }

  // /**
  //  * 保存用户信息至本地
  //  * @param userData
  //  */
  // async saveUserInfoLocal(userData: any) {
  //   let userStr: any = await this.storage.get(userData.address);
  //   let user: any = JSON.parse(userStr);
  //   if (user) {
  //     this.userInfo = userData;
  //     this.address = userData.address;
  //     this.fee = userData.fee;
  //     this.balance = userData.balance;
  //     await this.storage.set(userData.address, JSON.stringify(userData));
  //   } else {
  //     await this.saveUserSettings(userData.address, {});
  //     await this.storage.set(userData.address, JSON.stringify(userData));
  //   }
  // }

  // /**
  //  * 更新用户设置参数
  //  * @param address 账户地址
  //  * @param settingParams 设置改变的参数
  //  * -- 默认参数 --
  //  *  fingerPrint : false,
  //     sound : false,
  //     autoDig : false,
  //     digRound : 0,
  //     background : false,
  //     report : false,
  //     animate : true,
  //     digAtWifi : true,
  //     autoUpdate : false,
  //     fee : 0.00000001,
  //  */
  // async saveUserSettings(settingParams: SettingParams, address = this.address) {
  //   if (!address) {
  //     return;
  //   }
  //   let settingStr: any = await this.storage.get("s_" + address);
  //   let settings = JSON.parse(settingStr);
  //   if (settings && Object.keys(settings).length > 0) {
  //     for (let i of Object.keys(settings)) {
  //       settings[i] = settingParams[i];
  //     }
  //   } else {
  //     // default
  //     settings = {
  //       fingerPrint: false,
  //       sound: false,
  //       autoDig: false,
  //       digRound: 0,
  //       background: false,
  //       report: false,
  //       animate: true,
  //       digAtWifi: true,
  //       autoUpdate: false,
  //       fee: 0.00000001,
  //     };
  //   }
  //   debugger;

  //   // this.userSettings = settings;
  //   await this.storage.set("s_" + address, JSON.stringify(settings));
  // }
}
// export type SettingParams = {
//   fingerPrint?: boolean;
//   sound?: boolean;
//   autoDig?: boolean;
//   digRound?: number;
//   background?: boolean;
//   report?: boolean;
//   animate?: boolean;
//   digAtWifi?: boolean;
//   autoUpdate?: boolean;
//   fee?: number;
// };
