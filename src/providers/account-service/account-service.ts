import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
  AppSettingProvider
} from "../app-setting/app-setting";
import { AppFetchProvider, CommonResponseData } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject } from "rxjs";
import * as IFM from 'ifmchain-ibt';


@Injectable()
export class AccountServiceProvider {
  ifmJs: any;
  account: any;
  constructor(
    public http: HttpClient,
    public translateService: TranslateService,
    public storage : Storage,
    public appSetting: AppSettingProvider,
    public fetch: AppFetchProvider,
  ) {
    this.ifmJs = AppSettingProvider.IFMJS;
    this.account = AppSettingProvider.IFMJS.Api(AppSettingProvider.HTTP_PROVIDER).account;
  }

  async getAccountByAddress(address) {
    let data = await this.account.getUserByAddress(address);
    console.log(data);
  }
}
