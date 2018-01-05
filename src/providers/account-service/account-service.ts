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

/*
  Generated class for the AccountServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class AccountServiceProvider {
  constructor(public http: HttpClient) {
    console.log("Hello AccountServiceProvider Provider");
  }
}
