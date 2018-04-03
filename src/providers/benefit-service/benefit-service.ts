import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
  AppFetchProvider,
  CommonResponseData,
  ServerResError,
} from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject, Subscription } from "rxjs";
import {
  AppSettingProvider,
  TB_AB_Generator,
  ROUND_AB_Generator,
  AsyncBehaviorSubject,
  HEIGHT_AB_Generator,
} from "../app-setting/app-setting";
import { BlockServiceProvider } from "../block-service/block-service";
import { LoginServiceProvider } from "../login-service/login-service";
import { AccountServiceProvider } from "../account-service/account-service";
import { UserInfoProvider } from "../user-info/user-info";
import * as TYPE from "./benefit.types";
export * from "./benefit.types";
import * as IFM from "ifmchain-ibt";
import {
  PromiseOut,
  PromisePro,
} from "../../../src/bnqkl-framework/PromiseExtends";
import * as PIXI_SOUND from "pixi-sound";
console.log("--PIXI_SOUND", PIXI_SOUND);
PIXI.sound.add("coinSoundFew", "assets/sounds/coinFew.wav");
PIXI.sound.add("coinSoundMore", "assets/sounds/coinMore.wav");
PIXI.sound.add("coinSoundMuch", "assets/sounds/coinMuch.wav");

@Injectable()
export class BenefitServiceProvider {
  ifmJs: any;
  // benefitList: TYPE.BenefitModel[] = [];
  // benefitBlockHeight?: number;
  constructor(
    public http: HttpClient,
    public storage: Storage,
    public translate: TranslateService,
    public fetch: AppFetchProvider,
    public appSetting: AppSettingProvider,
    public blockService: BlockServiceProvider,
    public accountService: AccountServiceProvider,
    public user: UserInfoProvider,
    public loginService: LoginServiceProvider,
  ) {
    this.ifmJs = AppSettingProvider.IFMJS;
    this.loginService.loginStatus.subscribe(isLogined => {
      if (isLogined) {
        this._play_mining_sound_register_Executor();
      } else {
        if (this._play_mining_sound_sub) {
          this._play_mining_sound_sub.unsubscribe();
          this._play_mining_sound_sub = undefined;
          this._pre_mining_block = undefined;
        }
      }
    });
  }

  readonly GET_BENEFIT = this.appSetting.APP_URL(
    "/api/accounts/balanceDetails",
  );

  // /**
  //  * 增量查询我的前n个收益，增量
  //  * @param {boolean} increment
  //  * @param page
  //  * @param limit
  //  * @returns {Promise<Object[]>}
  //  */
  // async getTop57Benefits(increment: boolean): Promise<TYPE.BenefitModel[]> {
  //   // //超过100个则删除数组至100个
  //   // if (this.benefitList && this.benefitList.length > 100) {
  //   //   this.benefitList .length = 1000;
  //   // }

  //   const last_block_height = this.appSetting.getHeight();
  //   //增量
  //   if (increment) {
  //     let lastBlockHeight = this.benefitBlockHeight;

  //     if (lastBlockHeight) {
  //       let blockBetween = last_block_height - lastBlockHeight;
  //       //没有更新且有缓存则返回缓存
  //       if (blockBetween == 0 && this.benefitList.length == 57) {
  //         return this.benefitList.slice(0, 56);
  //       } else if (blockBetween < 57 && this.benefitList.length >= 56) {
  //         //块有更新有缓存且小于limit，返回增量
  //         let query = {
  //           limit: blockBetween,
  //           orderBy: "md_timestamp:desc",
  //           address: this.user.userInfo.address,
  //         };

  //         let data = await this.getBenefits(query);
  //         let temp: any;
  //         temp = data;
  //         temp.unshift(temp.length, 0);
  //         // data.unshift(data[0], 0);
  //         Array.prototype.splice.apply(this.benefitList, temp);
  //         this.benefitList = temp;
  //         this.benefitBlockHeight! = last_block_height;
  //         return this.benefitList.slice(0, 56);
  //       }
  //     } else {
  //       return await this.getTop57Benefits(false);
  //     }
  //   } else {
  //     //获取最近57个
  //     let query = {
  //       limit: 57,
  //       orderBy: "md_timestamp:desc",
  //       address: this.user.userInfo.address,
  //     };
  //     this.benefitBlockHeight! = last_block_height;
  //     let benefitData = await this.getBenefits(query);
  //     this.benefitList = benefitData;
  //   }
  //   return this.benefitList;
  // }
  async getBenefitsByRound(
    limit = this.top_benefit_size,
    rounds = this.appSetting.getRound(),
  ) {
    let query = {
      limit,
      orderBy: "md_timestamp:desc",
      address: this.user.userInfo.address,
      rounds,
    };
    let benefitData = await this.getBenefits(query);
    return benefitData;
  }

  getLatestRoundBenefits(limit = this.top_benefit_size) {
    return this.getBenefitsByRound(limit, this.appSetting.getRound());
  }

  top_benefit_size = 57;
  private _topBenefits?: TYPE.BenefitModel[];
  topBenefits!: AsyncBehaviorSubject<TYPE.BenefitModel[]>;
  @HEIGHT_AB_Generator("topBenefits")
  topBenefits_Executor(promise_pro) {
    return promise_pro.follow(
      this.getLatestRoundBenefits().then(list => {
        if (this._topBenefits && list.length) {
          this._topBenefits.unshift(...list);
          this._topBenefits.sort((a, b) => {
            return b.height - a.height;
          });
          const filter_res = [this._topBenefits[0]];
          for (let i = 1; i < this._topBenefits.length; i += 1) {
            if (
              filter_res[filter_res.length - 1].height !=
              this._topBenefits[i].height
            ) {
              // 过滤掉一样的，尽管从逻辑上来说，不可能存在
              filter_res.push(this._topBenefits[i]);
            }
            if (filter_res.length >= this.top_benefit_size) {
              break;
            }
          }
          this._topBenefits = filter_res;
        } else {
          this._topBenefits = list.slice();
        }
        return this._topBenefits;
      }),
    );
  }

  /**
   * 获取我的收益
   * @param params
   * @returns {Promise<any>}
   */
  async getBenefits(params): Promise<TYPE.BenefitModel[]> {
    let data = await this.fetch.get<any>(this.GET_BENEFIT, { search: params });

    return data.balancedetails;
  }

  /**
   * 分页获取收益
   * 如果小于57且有TOP57的缓存则在TOP57中读取
   * @param page
   * @param pageSize
   */
  async getBenefitsByPage(
    page: number,
    pageSize: number,
  ): Promise<TYPE.BenefitModel[]> {
    if (this._topBenefits && this._topBenefits.length) {
      const from = (page - 1) * pageSize;
      const to = page * pageSize;
      if (this._topBenefits.length + 1 >= to) {
        return this._topBenefits.slice(from, to);
      }
    }

    return this.getBenefits({
      page,
      pageSize,
    });
  }

  /**
   * 也是需要57个块内获取本轮的块进行计算
   * 獲取本輪的收益
   */
  async getBenefitThisRound(address: string): Promise<number> {
    let currentRound = this.appSetting.getRound();
    let benefitThisRound = 0;
    const benefitList = await this.topBenefits.getPromise();
    for (let i of benefitList) {
      if (currentRound == this.appSetting.calcRoundByHeight(i.height)) {
        benefitThisRound += parseFloat(i.amount);
      } else {
        break;
      }
    }

    return benefitThisRound;
  }

  /**
   * 获取本轮收益
   */
  benefitThisRound!: AsyncBehaviorSubject<number>;
  @HEIGHT_AB_Generator("benefitThisRound", true)
  benefitThisRound_Executor(promise_pro) {
    console.log("更新 benefitThisRound%c", "color:red;background:#FFF");
    return promise_pro.follow(this.getBenefitThisRound(this.user.address));
  }

  private _play_mining_sound_sub?: Subscription;
  private _pre_mining_block?: TYPE.BenefitModel;
  private _play_mining_sound_register_Executor() {
    if (this._play_mining_sound_sub) {
      this._play_mining_sound_sub.unsubscribe();
      this._pre_mining_block = undefined;
    }
    this._play_mining_sound_sub = this.appSetting.height.subscribe(async r => {
      const benefitList = await this.topBenefits.getPromise();
      // 初始化 _pre_mining_block
      if (this._pre_mining_block === undefined) {
        this._pre_mining_block = benefitList[0];
        return;
      }

      const cur_block_benefit = benefitList[0];
      if (cur_block_benefit.height > this._pre_mining_block.height) {
        const cur_benefit = parseFloat(cur_block_benefit.amount);
        const pre_benefit = parseFloat(this._pre_mining_block.amount);

        const equal_range = [pre_benefit * 0.9, cur_benefit * 1.1];
        let sound_type = "coinSoundMore";
        if (Math.max(...equal_range, pre_benefit) === pre_benefit) {
          let sound_type = "coinSoundMuch";
        } else if (Math.min(...equal_range, pre_benefit) === cur_benefit) {
          let sound_type = "coinSoundFew";
        }
        PIXI.sound.play(sound_type);
      }
    });
  }

  /**
   * 获取最近1个块的收益
   */
  async getRecentBenefit(): Promise<number> {
    const benefitList = await this.topBenefits.getPromise();
    if (benefitList && benefitList.length > 0) {
      return parseInt(benefitList[0].amount);
    } else {
      return 0;
    }
  }

  recentBenefit!: AsyncBehaviorSubject<number>;
  @HEIGHT_AB_Generator("recentBenefit", true)
  recentBenefit_Executor(promise_pro) {
    return promise_pro.follow(this.getRecentBenefit());
  }
}
