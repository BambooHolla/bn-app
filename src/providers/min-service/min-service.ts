import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppFetchProvider } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject} from "rxjs";
import { AppSettingProvider } from "../app-setting/app-setting";
import { BlockServiceProvider } from "../block-service/block-service";
import * as IFM from 'ifmchain-ibt';

/*
  Generated class for the MinServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class MinServiceProvider {
  constructor(
    public http: HttpClient,
    public appFetch: AppFetchProvider,
    public translateService: TranslateService,
    public storage : Storage,
    public appSetting : AppSettingProvider
  ) {
  }
  ifmJs = AppSettingProvider.IFMJS;

  readonly ROUND_TIME = '/api/delegates/roundTime';

  /**
   * 获取块剩余时间
   * @returns {Promise<void>}
   */
  async getRoundRemainTime () {
    let roundTimeUrl = this.appSetting.APP_URL(this.ROUND_TIME);

    let roundTimeData = await this.appFetch.get<any>(roundTimeUrl);
    let roundTime = roundTimeData.nextRoundTime;


  }

  async getBlockRemainTime () {

  }
}
