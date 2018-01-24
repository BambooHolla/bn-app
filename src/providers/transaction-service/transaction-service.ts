import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppFetchProvider } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject} from "rxjs";
import { AppSettingProvider } from "../app-setting/app-setting";
import { AlertController } from "ionic-angular";
import * as IFM from 'ifmchain-ibt';

/*
  Generated class for the TransactionServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class TransactionServiceProvider {
  ifmJs: any;
  transaction: any;
  transactionTypeCode: object;
  constructor(
    public http: HttpClient,
    public appSetting: AppSettingProvider,
    public storage: Storage,
    public translateService: TranslateService,
    public alertController: AlertController,
    public fetch : AppFetchProvider
  ) {
    console.log('Hello TransactionServiceProvider Provider');
    this.ifmJs = AppSettingProvider.IFMJS;
    this.transaction = this.ifmJs.Api(AppSettingProvider.HTTP_PROVIDER).transaction;
    this.transactionTypeCode = this.ifmJs.transactionTypes;
  }

  getTransactionLink (type) {
      switch (type) {
        case this.transactionTypeCode.SEND:
          return "transactions/tx";
        //“签名”交易
        case this.transactionTypeCode.SIGNATURE:
          return "signatures/tx";
        //注册为受托人
        case this.transactionTypeCode.DELEGATE:
          return "delegates/tx";
        //投票
        case this.transactionTypeCode.VOTE:
          return "accounts/tx/delegates";
        //注册用户别名地址
        case this.transactionTypeCode.USERNAME:
          return "accounts/tx/username";
        //添加联系人
        case this.transactionTypeCode.FOLLOW:
          return "contacts/tx";
        //注册多重签名帐号
        case this.transactionTypeCode.MULTI:
          return "multisignatures/tx";
        // 侧链应用
        case this.transactionTypeCode.DAPP:
          return "dapps/tx"
        // //转入Dapp资金
        // case transactionTypes.IN_TRANSFER:
        //     return "xxxxx"
        // //转出Dapp资金
        // case transactionTypes.OUT_TRANSFER:
        // return "xxxxx"
        //点赞
        case this.transactionTypeCode.FABULOUS:
          return "fabulous/tx";
        //打赏
        case this.transactionTypeCode.GRATUITY:
          return "gratuities/tx";
        //发送信息
        case this.transactionTypeCode.SENDMESSAGE:
          return "messages/tx";
        //侧链数据存证
        case this.transactionTypeCode.MARK:
          return "marks/tx";
      }
  }

  /**
   * 根据交易ID获取交易信息
   * @param {string} id
   * @returns {Promise<any>}
   */
  async getTransactionById (id: string) {
    let data = this.transaction.getTransactionById(id);

    return data.transactions[0];
  }

  /**
   * 获取交易时间，交易所需
   * @returns {Promise<any>}
   */
  async getTimestamp () {
    let data = this.transaction.getTimestamp();

    return data;
  }

  /**
   * 交易请求，发送
   * @param txData
   * @returns {Promise<boolean>}
   */
  async putTransaction(txData) {
    try {
      if(this.validateTxdata(txData)) {
        //获取url，获取类型
        let transactionUrl = this.appSetting.APP_URL(this.getTransactionLink(txData.type)).toString();
        console.log(transactionUrl);
        // txData.type = txData.type || this.transactionTypeCode[txData.typeName];
        //获取时间戳
        let timestampRes = await this.getTimestamp();
        if(timestampRes.success) {
          //时间戳加入转账对象
          txData.timestamp = timestampRes.timestamp;
          //生成转账        await上层包裹的函数需要async
          debugger
          this.ifmJs.transaction.createTransaction(txData, async (err,transaction)=> {
            debugger
            if(err) throw err;
            let data = await this.fetch.put<T>(transactionUrl, transaction);
            if(data.success) {
              return true;
            }else {
              throw data.error;
            }
          })
        }
      }else {
        throw "validate error";
      }
    }catch(e) {
      let alert = this.alertController.create({
        title: 'transfer error',
        subTitle: e || e.message,
        buttons: ['OK']
      })
      alert.present();
      return false;
    }
  }

  /**
   * 验证交易类型
   * @param txData
   * @returns {boolean}
   */
  validateTxdata (txData) {
    debugger
    if(txData) {
      if(!txData.type && txData.type !== 0) {
        console.log('tx type error');
        return false;
      }

      if(!txData.secret) {
        console.log('tx secret error');
        return false;
      }

      if((txData.type === 'SEND' && !txData.recipientId) || (txData.type === 'SEND' && !txData.amount)) {
        console.log('tx is send and recipient is null');
        return false;
      }
      if(!txData.fee) {
        console.log('tx fee type error');
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * 根据地址获得交易，分页
   * @param {string} address
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<any>}
   */
  async getUserTransactions (address: string, page = 1, limit = 10) {
    var query = {
      "senderId" : address,
      "recipientId" : address,
      "offset" : (page-1)*limit,
      "limit" : limit,
      "orderBy" : "t_timestamp:desc"
    }
    let data = await this.getTransactions(query);

    if(data.success) {
      return data.transactions;
    }else {
      return [];
    }
  }

  /**
   * 获取交易
   * @param {{}} query
   * @returns {Promise<{}>}
   */
  async getTransactions (query = {}) {
    let data = {};
    if(typeof(query) === 'object' || typeof(query) === undefined) {
      data = await this.block.getTransactions(query);
    }

    return data;
  }

}
