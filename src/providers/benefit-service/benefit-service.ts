import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppFetchProvider, CommonResponseData } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject } from "rxjs";
import { AsyncBehaviorSubject } from "../../bnqkl-framework/RxExtends";
import { AppSettingProvider, TB_AB_Generator} from "../app-setting/app-setting";
import { BlockServiceProvider } from "../block-service/block-service";
import { AccountServiceProvider } from "../account-service/account-service";
import { UserInfoProvider } from "../user-info/user-info"
import * as IFM from 'ifmchain-ibt';


/*
  Generated class for the BenefitServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class BenefitServiceProvider {
  ifmJs: any;
  benefitList: any;
  benefitBlockHeight: number;
  constructor(
    public http: HttpClient,
    public storage: Storage,
    public translate: TranslateService,
    public fetch : AppFetchProvider,
    public appSetting: AppSettingProvider,
    public blockService: BlockServiceProvider,
    public accountService: AccountServiceProvider,
    public user: UserInfoProvider,
  ) {
    this.ifmJs = AppSettingProvider.IFMJS;
  }

  readonly GET_BENEFIT = "/api/accounts/balanceDetails";

  /**
   * 增量查询我的前n个收益，增量
   * @param {boolean} increment
   * @param page
   * @param limit
   * @returns {Promise<Object[]>}
   */
  async getTop57Benefits(increment:boolean) {
    //超过100个则删除数组至100个
    if(this.benefitList.length > 100) {
      this.benefitList = this.benefitList.splice(0, 100);
    }
    
    let lastBlockRes = await this.blockService.getLastBlock();    
    //增量
    if(increment) {
      let lastBlockHeight = this.benefitBlockHeight;
      
      if(lastBlockHeight) {
        let blockBetween = lastBlockRes - lastBlockHeight;
        //没有更新且有缓存则返回缓存
        if(blockBetween == 0 && this.benefitList.length == 57) {
          return this.benefitList.slice(0, 56);
        }else if(blockBetween < 57 && this.benefitList.length >= 56) {
          //块有更新有缓存且小于limit，返回增量
          let query = {
            limit : blockBetween,
            orderBy: 'md_timestamp:desc',
            address: this.user.userInfo.address
          }
          
          let data = await this.getBenefits(query);
          data.unshift(data.length, 0);
          Array.prototype.splice.apply(this.benefitList, data);
          this.benefitBlockHeight = lastBlockRes;
          return this.benefitList.slice(0, 56);
        }
      }else {
        this.getTop57Benefits(false);
      }
    }else {
      //获取最近57个
      let query = {
        limit: 57,
        orderBy: 'md_timestamp:desc',
        address: this.user.userInfo.address
      }
      this.benefitBlockHeight = lastBlockRes;
      let benefitData = this.getBenefits(query);
      this.benefitList = benefitData;
    }
  }

  /**
   * 获取我的收益
   * @param params
   * @returns {Promise<any>}
   */
  async getBenefits(params) {
    let getBenefitUrl = this.appSetting.APP_URL(this.GET_BENEFIT);
    let data = await this.fetch.get<any>(getBenefitUrl, params);

    if(data.success) {
      return data.balancedetails;
    }else {
      return [];
    }
  }
  
  /**
   * 分页获取收益
   * 如果小于57且有TOP57的缓存则在TOP57中读取
   * @param page 
   * @param limit 
   */
  async getBenefitsByPage(page: number, limit : number) {
    //如果小于57则获取缓存中的收益
    if( page*limit < 57 && this.benefitList.length >=57) {
      return this.benefitList.slice((page-1)*limit, limit);
    }else {
      let query = {
        offset : (page-1) * limit,
        limit: limit,
        address: this.user.userInfo.address      
      }
  
      let data = await this.getBenefits(query);
      return data;
    }
  }
  
  /**
   * 也是需要57个块内获取本轮的块进行计算
   */
  async getBenefitThisRound() {
    let currentHeightRes = await this.blockService.getLastBlock();
    let currentRound = Math.floor(currentHeightRes/57);
    let benefitThisRound = 0;
    if(this.benefitList.length >= 57) {
      for(let i of this.benefitList) {
        if(currentRound == Math.floor(i.height/57)) {
          benefitThisRound += i.amount;
        }else {
          break;
        }
      }
    }else {
      this.getTop57Benefits(false);
    }

    return benefitThisRound;
  }
}
