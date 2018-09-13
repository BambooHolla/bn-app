import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
  AppFetchProvider,
  CommonResponseData,
  ServerResError,
} from "../app-fetch/app-fetch";
import { Platform } from "ionic-angular";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject, Subscription } from "rxjs";
import { FLP_Tool } from "../../bnqkl-framework/FLP_Tool";

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
import {
  PromiseOut,
  PromisePro,
  sleep,
} from "../../bnqkl-framework/PromiseExtends";
import { addSound, playSound } from "../../components/sound";
import { LocalNotifications } from "@ionic-native/local-notifications";
import { CommonService } from "../commonService";

@Injectable()
export class BenefitServiceProvider extends CommonService {
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
    public localNotifications: LocalNotifications,
    public platform: Platform
  ) {
    super();
    this.ifmJs = AppSettingProvider.IFMJS;
    this.loginService.loginStatus
      .distinctUntilChanged()
      .subscribe(isLogined => {
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
    "/api/accounts/balanceDetails"
  );

  async getBenefitsByRound(
    offset = 0,
    limit = this.top_benefit_size,
    rounds = this.appSetting.getRound(),
    address = this.user.userInfo.address
  ) {
    let query = {
      offset,
      limit,
      orderBy: "md_timestamp:desc",
      address,
      rounds,
    };
    let benefitData = await this.getBenefits(query);
    return benefitData;
  }

  async getMyLatestRoundBenefits() {
    const round = this.appSetting.getRound();
    const list = await this.getBenefitsByRound(0, this.top_benefit_size, round);
    if (list.length === this.top_benefit_size) {
      return list.concat(
        await this.getBenefitsByRound(
          this.top_benefit_size,
          this.top_benefit_size,
          round
        )
      );
    }
    return list;
  }

  async getMySecondLastRoundBenefits() {
    const round = this.appSetting.getRound() - 1;
    const list = await this.getBenefitsByRound(0, this.top_benefit_size, round);
    if (list.length === this.top_benefit_size) {
      return list.concat(
        await this.getBenefitsByRound(
          this.top_benefit_size,
          this.top_benefit_size,
          round
        )
      );
    }
    return list;
  }

  top_benefit_size = 57;
  max_top_benefit_size = 57 * 4;
  private _topBenefits?: TYPE.BenefitModel[];
  topBenefits!: AsyncBehaviorSubject<TYPE.BenefitModel[]>;
  @HEIGHT_AB_Generator("topBenefits", true)
  topBenefits_Executor(promise_pro) {
    return promise_pro.follow(
      Promise.all([
        this.getMyLatestRoundBenefits(),
        this.getMySecondLastRoundBenefits(),
      ])
        .then(lists => lists[0].concat(lists[1]))
        .then(list => {
          if (this._topBenefits && list.length) {
            this._topBenefits.unshift(...list);
            this._topBenefits.sort((a, b) => {
              return b.height - a.height;
            });
            const ids_set = new Set();
            const filter_res = [this._topBenefits[0]];
            for (var i = 1; i < this._topBenefits.length; i += 1) {
              const next_item = this._topBenefits[i];
              if (!ids_set.has(next_item._id)) {
                // 过滤掉一样的
                ids_set.add(next_item._id);
                filter_res.push(next_item);
              }
              if (filter_res.length >= this.max_top_benefit_size) {
                break;
              }
            }
            this._topBenefits = filter_res;
          } else {
            this._topBenefits = list.slice();
          }
          return this._topBenefits;
        })
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
    address = this.user.address
  ): Promise<TYPE.BenefitModel[]> {
    if (this._topBenefits && this._topBenefits.length) {
      const from = (page - 1) * pageSize;
      const to = page * pageSize;
      if (this._topBenefits.length + 1 >= to) {
        return this._topBenefits.slice(from, to);
      }
    }

    return this.getBenefits({
      orderBy: "timestamp:desc",
      page,
      pageSize,
      address,
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
    for (var i of benefitList) {
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
  private _notify_id: number | null = null;
  private _acc_notify_blocks: TYPE.BenefitModel[] = [];
  private _is_play_sound = true;
  togglePlaySound(play: boolean) {
    this._is_play_sound = play;
  }
  private _play_mining_sound_register_Executor() {
    if (this._play_mining_sound_sub) {
      this._play_mining_sound_sub.unsubscribe();
      this._pre_mining_block = undefined;
    }
    this._play_mining_sound_sub = this.appSetting.after_height.subscribe(
      async r => {
        if (!this.appSetting.settings.sound_effect) {
          return;
        }
        const benefitList = await this.topBenefits.getPromise();
        // 初始化 _pre_mining_block
        if (this._pre_mining_block === undefined) {
          this._pre_mining_block = benefitList[0];
          return;
        }

        const cur_block_benefit = benefitList[0];
        if (
          !this._pre_mining_block ||
          (cur_block_benefit &&
            cur_block_benefit.height > this._pre_mining_block.height)
        ) {
          this.emit("get-benefit");
          setTimeout(() => {
            if (this._is_play_sound) {
              playSound("coinSingle");
            }
          }, 500);
          // 系统通知
          if (
            FLP_Tool.isInCordova &&
            this.appSetting.settings.mining_income_notice
          ) {
            let mode = "single";
            if (this._notify_id !== null) {
              if (await this.localNotifications.isPresent(this._notify_id)) {
                mode = "multi";
              } else {
                this._notify_id = null;
                this._acc_notify_blocks.length = 0; // 清空缓存
              }
            }

            this._acc_notify_blocks.push(cur_block_benefit);

            if (mode === "single") {
              this.localNotifications.schedule({
                id: (this._notify_id = this.appSetting.getHeight()),
                text: this.translate.instant("MINING_INCOME_#AMOUNT#IBT", {
                  amount: (parseFloat(cur_block_benefit.amount) / 1e8).toFixed(
                    8
                  ),
                }),
                sound: this.platform.is("android")
                  ? "file://sound.mp3"
                  : "file://beep.caf",
                // data: { secret: key },
              });
            } else if (mode === "multi") {
              const total_amount = this._acc_notify_blocks.reduce(
                (acc_amount, benefit) =>
                  acc_amount + parseFloat(benefit.amount),
                0
              );
              this.localNotifications.update({
                id: this._notify_id as number,
                text: this.translate.instant(
                  "MULTI#TIMES#_MINING_INCOME_#AMOUNT#IBT",
                  {
                    times: this._acc_notify_blocks.length,
                    amount: (total_amount / 1e8).toFixed(8),
                  }
                ),
              });
            }
          }
          this._pre_mining_block = cur_block_benefit;
        }
      }
    );
  }

  /**
   * 获取最近1个块的收益
   */
  async getRecentBenefit(): Promise<number> {
    const benefitList = await this.topBenefits.getPromise();
    var res = 0;
    if (benefitList && benefitList.length > 0) {
      res = parseInt(benefitList[0].amount);
      if (res > 0 && !this.appSetting.settings._has_mining_income) {
        this.appSetting.settings._has_mining_income = true;
      }
    }
    return res;
  }

  recentBenefit!: AsyncBehaviorSubject<number>;
  @HEIGHT_AB_Generator("recentBenefit", true)
  recentBenefit_Executor(promise_pro) {
    return promise_pro.follow(this.getRecentBenefit());
  }
}
