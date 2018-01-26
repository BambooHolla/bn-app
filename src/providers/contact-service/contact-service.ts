import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppFetchProvider, CommonResponseData } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject } from "rxjs";
// import { PromisePro } from "../../bnqkl-framework/RxExtends";
import { AsyncBehaviorSubject } from "../../bnqkl-framework/RxExtends";
import { AppSettingProvider, TB_AB_Generator} from "../app-setting/app-setting";
import { AccountServiceProvider } from "../account-service/account-service";
import { TransactionServiceProvider } from "../transaction-service/transaction-service";
import * as IFM from 'ifmchain-ibt';

@Injectable()
export class ContactServiceProvider {
  ifmJs : any;
  contact: any;
  transactionTypes: any;
  constructor(
    public http: HttpClient,
    public appSetting: AppSettingProvider,
    public storage: Storage,
    public translateService: TranslateService,
    public fetch : AppFetchProvider,
    public accountService: AccountServiceProvider,
    public transactionService: TransactionServiceProvider,
  ) {
    this.ifmJs = AppSettingProvider.IFMJS;
    this.transactionTypes = this.ifmJs.transactionTypes;
  }

  readonly GET_CONTACT = '/api/contacts';

  /**
   * 获取我的联系人，默认返回所有
   * @param opt
   * opt - 0 || !opt : 获取已添加和未添加
   * opt - 1 : 获取已添加
   * opt - 2 : 获取未添加
   */
  async getMyContacts(opt ?: number) {
    try {
      let getContactUrl = this.appSetting.APP_URL(this.GET_CONTACT);

      let query = {
        publicKey: this.accountService.userInfo.publicKey
      }
      let data = await this.fetch.get<any>(getContactUrl, {params: query});
      
      if(data.success) {
        switch(opt) {
          case 0:
            return {following: data.following, follower: data.follower};
          case 1:
            return data.following;
          case 2:
            return data.follower;
          default:
            return {following: data.following, follower: data.follower};
        }
      }else {
        throw "Get contact list error";
      }
    }catch(e) {
      console.log(e);
    }
  }

  async ignoreContact() {

  }
  
  /**
   * 添加联系人，密码、二次密码，地址（可选），用户名（可选），地址和用户名必选一种
   * @param secret 
   * @param secondSecret 
   * @param address 
   * @param username 
   */
  async addContact(secret : string, secondSecret ?: string, address ?: string, username ?: string) {
    try {
      if(!address && !username) {
        throw "Parameters cannot find address and username";
      }

      if(username) {
        let userAddress = await this.accountService.getAccountByUsername(username);
        address = userAddress.address;
      }

      let txData = {
        type: this.transactionTypes.FOLLOW,
        amount: '0',
        secret: secret,
        asset: {
          contact: {
            address: '+' + address
          }
        },
        fee: this.accountService.userInfo.fee,
        publicKey: this.accountService.userInfo.publicKey,
        secondSecret
      }

      if(secondSecret) {
        txData.secondSecret = secondSecret;
      }

      let data: boolean = await this.transactionService.putTransaction(txData);
      return data;
    }catch(e) {
      console.log(e);
    }
  }
  
  /**
   * 根据地址或用户名获得用户信息，地址或用户名取其一
   * @param address 
   * @param username 
   */
  async searchContact(address ?: string, username ?: string) {
    if(address) {
      return await this.accountService.getAccountByAddress;
    }else if(username) {
      return await this.accountService.getAccountByUsername;
    }else {
      return {} as object;
    }
  }
}
