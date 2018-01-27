import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Storage } from "@ionic/storage";



@Injectable()
export class UserInfoProvider {
  userInfo: any;
  userSettings: any;
  fee: any;
  balance: any;
  address: any;
  constructor(
    public storage : Storage
  ) {}
  
  /**
   * 获取用户信息
   * @param address 
   */
  async getUserSettingLocal(address: string) {
    let userStr:any = this.storage.get(address);
    let user = JSON.parse(userStr);
    this.userInfo = user;
    this.address = user.address;    
    this.fee = user.fee;
    this.balance = user.balance;
  }
  
  /**
   * 保存用户信息至本地
   * @param userData 
   */
  async saveUserInfoLocal(userData: any) {
    let userStr: any = await this.storage.get(userData.address);
    let user: any = JSON.parse(userStr);
    if (user) {
      this.userInfo = userData;
      await this.storage.set(userData.address, JSON.stringify(userData));
    } else {
      await this.saveUserSettings(userData.address, {});
      await this.storage.set(userData.address, JSON.stringify(userData));
    }
  }
  
  /**
   * 更新用户设置参数
   * @param address 账户地址
   * @param settingParams 设置改变的参数
   * -- 默认参数 --
   *  fingerPrint : false,
      sound : false,
      autoDig : false,
      digRound : 0,
      background : false,
      report : false,
      animate : true,
      digAtWifi : true,
      autoUpdate : false,
      fee : 0.00000001,
   */
  async saveUserSettings(address, settingParams: object) {
    let settingStr: any = await this.storage.get('s_' + address);
    let settings = JSON.parse(settingStr);
    if(settings && Object.keys(settings).length > 0) {
      for(let i of Object.keys(settings)) {
        settings[i] = settingParams[i];
      }
    }else {
      // default
      let settings = {
        fingerPrint : false,
        sound : false,
        autoDig : false,
        digRound : 0,
        background : false,
        report : false,
        animate : true,
        digAtWifi : true,
        autoUpdate : false,
        fee : 0.00000001,
      }
    }

    this.userSettings = settings;
    await this.storage.set('s_' + address, JSON.stringify(settings));    
  }

}
