import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppFetchProvider } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject} from "rxjs";
import { AppSettingProvider } from "../app-setting/app-setting";
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
  transactionType: object;
  transactionTypeCode: object;
  constructor(
    public http: HttpClient,
    public appSetting: AppSettingProvider,
    public storage: Storage,
    public translateService: TranslateService,
    public fetch : AppFetchProvider
  ) {
    console.log('Hello TransactionServiceProvider Provider');
    this.ifmJs = AppSettingProvider.IFMJS;
    this.transaction = this.ifmJs.Api(AppSettingProvider.HTTP_PROVIDER).transaction;
    this.transactionType = {
      "SEND" : "transactions/tx",
      "SIGNATURE" : "signatures/tx",
      "DELEGATE" : "telegates/tx",
      "VOTE" : "accounts/tx/delegates",
      "FOLLOW" : "contacts/tx",
      "MULTI" : "multisignatures/tx",
      "DAPP" : "dapps/tx",
      "FABULOUS" : "fabulous/tx",
      "GRATUITIES" : "gratuties/tx",
      "MARK" : "marks/tx",
    }
    this.transactionTypeCode = this.ifmJs.transactionTypes;
  }

  async getTransactionById (id: string) {
    let data = this.transaction.getTransactionById(id);

    return data;
  }

  async getTimestamp () {
    let data = this.transaction.getTimestamp();

    return data;
  }

  async putTransaction(txData) {
    /**
     * txData ---------
     * !type
     * amount --- 只有手续费的不需要
     * !senderPublicKey --- publicKey
     * senderId --- 不需要
     * recipientId --- 接受者需要
     * !fee --- toString
     * recipientUsername --- 不需要
     * !keypair --- 密码
     * !secondKeypair --- 二次密码
     * newSecondKeypair --- 不清楚
     * !timestamp
     * remark
     * asset
     */

    /**
     * 一般需要的参数
     * type
     * secret
     * amount
     * recipientId
     * publicKey
     * secondSecret
     * fee
     */
    let that = this;

    if(this.validateTxdata(txData)) {
      let transactionUrl = this.appSetting.APP_URL(that.transactionType[txData.typeName]);
      txData.type = txData.type || that.transactionTypeCode[txData.typeName];
      //获取时间戳
      this.getTimestamp()
        .then(function(timestampRes) {
          if(timestampRes.success) {
            debugger
            //时间戳加入转账对象
            txData.timestamp = timestampRes.timestamp;
            //生成转账
            console.log(that.ifmJs);
            debugger
            that.ifmJs.transaction.createTransaction(txData, function(err, transaction) {
              if(err) {
                throw err;
              }else {
                let data = that.AppFetchProvider.put<any>(transactionUrl, transaction);
                console.log(data);
                //data: {success, block:{id, height, timestamp}}
                return data;
              }
            })
          }
        })
    }
  }

  validateTxdata (txData) {
    debugger
    if(txData) {
      if(!txData.type && !txData.typeName) {
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

}
