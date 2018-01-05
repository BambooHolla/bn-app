import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppFetchProvider, CommonResponseData } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject } from "rxjs";
// import { PromisePro } from "../../bnqkl-framework/RxExtends";
import { AsyncBehaviorSubject } from "../../bnqkl-framework/RxExtends";
import { AppSettingProvider, TB_AB_Generator} from "../app-setting/app-setting";
import * as IFM from 'ifmchain-ibt';

/*
  Generated class for the BlockServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class BlockServiceProvider {
  ifmJs: any;
  provider: any;
  block: any;
  constructor(
    public http: HttpClient,
    public appSetting: AppSettingProvider,
    public fetch: AppFetchProvider,
    public storage: Storage,
    public translateService: TranslateService
  ) {
    console.log('Hello BlockServiceProvider Provider');
    this.ifmJs = IFM(AppSettingProvider.NET_VERSION);
    this.provider = new this.ifmJs.HttpProvider(
      AppSettingProvider.SERVER_URL,
      AppSettingProvider.SERVER_TIMEOUT
    );
    // this.provider = AppSettingProvider.HTTP_PROVIDER;
    this.block = this.ifmJs.Api(this.provider).block;
    console.groupEnd();
  }
  readonly GET_LAST_BLOCK_URL = this.appSetting.APP_URL("/api/blocks/getLastBlock");

  //获取当前区块链的块高度
  async getLastBlock() {
    let data = await this.fetch.get<any>(this.GET_LAST_BLOCK_URL);

    return data;
  }

  //根据块ID获取块信息
  async getBlockById(blockId : string) {
    let data = this.block.getBlockById(blockId);

    return data;
  }

  //获取块
  async getBlocks(query) {
    if(typeof(query) === 'object' || typeof(query) === undefined) {
      let data = this.block.getBlocks(query);
    }

    return data;
  }

}

