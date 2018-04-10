import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AppFetchProvider } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject, Subscription } from "rxjs";
import { AlertController } from "ionic-angular";
import {
  AppSettingProvider,
  ROUND_AB_Generator,
  TB_AB_Generator,
  AsyncBehaviorSubject,
} from "../app-setting/app-setting";
import { BlockServiceProvider } from "../block-service/block-service";
import { AccountServiceProvider } from "../account-service/account-service";
import {
  TransactionServiceProvider,
  TransactionTypes,
} from "../transaction-service/transaction-service";
import { UserInfoProvider } from "../user-info/user-info";
import * as IFM from "ifmchain-ibt";
import { FLP_Form } from "../../../src/bnqkl-framework/FLP_Form";
import { FLP_Tool } from "../../../src/bnqkl-framework/FLP_Tool";
import { asyncCtrlGenerator } from "../../../src/bnqkl-framework/Decorator";
import {
  PromiseOut,
  PromisePro,
} from "../../../src/bnqkl-framework/PromiseExtends";
import * as TYPE from "./min.types";
export * from "./min.types";

/*
  Generated class for the MinServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class MinServiceProvider extends FLP_Tool {
  ifmJs: any;
  TransactionTypes = TransactionTypes;
  allVoters?: TYPE.RankModel[];
  allMinersInfo?: {
    list: TYPE.DelegateModel[];
    round: number;
  };

  constructor(
    public http: HttpClient,
    public fetch: AppFetchProvider,
    public translateService: TranslateService,
    public storage: Storage,
    public appSetting: AppSettingProvider,
    public accountService: AccountServiceProvider,
    public transactionService: TransactionServiceProvider,
    public blockService: BlockServiceProvider,
    public user: UserInfoProvider,
  ) {
    super();
    this.ifmJs = AppSettingProvider.IFMJS;
  }

  private _auto_vote_register!: AsyncBehaviorSubject<void>;
  private _auto_vote_sub?: Subscription;
  @TB_AB_Generator("_auto_vote_register")
  private _auto_vote_register_Executor(promise_pro: PromisePro<void>) {
    if (this._auto_vote_sub) {
      this._auto_vote_sub.unsubscribe();
    }
    this._auto_vote_sub = this.appSetting.round.subscribe(r => {
      if (this.appSetting.getUserToken()) {
        // 新的用户进来的话，界面的上的开启挖矿会自动触发vote函数，这里属于重复调用，但是autoVote会自动处理重复情况
        this.autoVote(r, "from-round-change");
      }
    });
    return promise_pro.reject();
  }

  readonly ROUND_TIME = this.appSetting.APP_URL("/api/delegates/roundTime");
  readonly VOTE_URL = this.appSetting.APP_URL(
    "/api/accounts/randomAccessDelegates",
  );
  readonly VOTE_FOR_ME = this.appSetting.APP_URL(
    "/api/accounts/voteForDelegate",
  );
  readonly FORGE_STATUS = this.appSetting.APP_URL(
    "/api/delegates/forging/status",
  );
  readonly MINERS = this.appSetting.APP_URL("/api/delegates");
  readonly MY_VOTES = this.appSetting.APP_URL("/api/accounts/delegates");
  readonly MY_RANK = this.appSetting.APP_URL("/api/accounts/myProfitRanking");
  readonly ALL_RANK = this.appSetting.APP_URL("/api/accounts/profitRanking");
  readonly TOTAL_VOTE = this.appSetting.APP_URL("/api/delegates/getTotalVote");
  readonly DELEGATE_INFO = this.appSetting.APP_URL("/api/delegates/get");

  getTotalVote() {
    return this.fetch
      .get<{ totalVoteByRound: number }>(this.TOTAL_VOTE)
      .then(data => data.totalVoteByRound);
  }
  totalVote!: AsyncBehaviorSubject<number>;
  @ROUND_AB_Generator("totalVote")
  totalVote_Executor(promise_pro: PromisePro<number>) {
    return promise_pro.follow(this.getTotalVote());
  }

  /**
   * 获取本轮剩余时间
   * @returns {Promise<void>}
   */
  async getRoundRemainTime() {
    let roundTimeUrl = this.ROUND_TIME;
    let roundTimeReq = {
      publicKey: this.user.userInfo.publicKey,
    };
    let roundProgress: any;

    let data = await this.fetch.get<{
      success: boolean;
      nextRoundTime: number;
      error?: any;
    }>(roundTimeUrl);
    let roundTime = data.nextRoundTime;
    let blockTimeRes = await this.transactionService.getTimestamp();
    if (blockTimeRes.success) {
      let blockTime = blockTimeRes.timestamp;
      roundProgress = ((1 - roundTime / (57 * blockTime / 1000)) * 100).toFixed(
        2,
      );
      return roundProgress;
    }

    return roundProgress;
  }

  /**
   * 投票
   * @param secret 主密码
   * @param secondSecret 支付密码
   */
  private async vote(secret: string, secondSecret?: string) {
    //首先获取时间戳
    let voteTimestamp = await this.transactionService.getTimestamp();

    //获取投票的人
    const resp = await this.fetch.get<any>(this.VOTE_URL, {
      search: { address: this.user.address },
    });
    //如果没有可投票的人，一般都是已经投了57票
    if (resp.delegate.length === 0) {
      throw await this.fetch.ServerResError.getI18nError(
        "you have already voted",
      );
    }
    let delegateArr: string[] = resp.delegate;
    let voteList: string[] = [];
    //票投给所有获取回来的人
    for (let delegate of delegateArr) {
      voteList.push("+" + delegate);
    }

    //设置投票的参数
    let txData: any = {
      type: this.TransactionTypes.VOTE,
      secret: secret,
      publicKey: this.user.userInfo.publicKey,
      fee: this.appSetting.settings.default_fee.toString(),
      timestamp: resp.timestamp,
      asset: {
        votes: voteList,
      },
    };

    if (secondSecret) {
      txData.secondSecret = secondSecret;
    }

    //成功完成交易
    try {
      await this.transactionService.putTransaction(txData);
      this.appSetting.settings.digRound = this.appSetting.getRound();
      this.appSetting.settings.background_mining = true;
    } catch (err) {
      console.error(err);
      throw await this.fetch.ServerResError.getI18nError(
        "vote transaction error",
      );
    }
  }

  /**
   * 自动投票
   */
  @FLP_Form.FromGlobal alertCtrl!: AlertController;
  @asyncCtrlGenerator.single()
  @asyncCtrlGenerator.error(() => FLP_Form.getTranslate("AUTO_VOTE_ERROR"))
  async autoVote(round, from?: any) {
    if (this.appSetting.settings.background_mining) {
      if ("from-round-change" === from) {
        const cache_key = this.user.publicKey + "|" + this.user.secondPublicKey;
        if (
          this._pre_round_pwd_info &&
          this._pre_round_pwd_info.cache_key != cache_key
        ) {
          // 二次密码发生了变动，或者帐号发生了变动
          this._pre_round_pwd_info = undefined;
        }
        if (!this.user.address) {
          // 如果已经没有用户处于在线状态，终止挖矿
          return;
        }
        if (!this._pre_round_pwd_info) {
          this._pre_round_pwd_info = await FLP_Form.prototype.getUserPassword();
        }
      }
      await this.tryVote(round, this._pre_round_pwd_info);
    }
  }
  private _pre_round_pwd_info?: any;

  @asyncCtrlGenerator.single()
  async tryVote(
    round = this.appSetting.getRound(),
    userPWD?: { password: string; pay_pwd?: string },
    from?: any,
  ) {
    if (this.appSetting.settings.digRound < round) {
      if (this._pre_round_pwd_info) {
      }
      if (!userPWD) {
        userPWD = await FLP_Form.prototype.getUserPassword();
      }
      await this.vote(userPWD.password, userPWD.pay_pwd);
    }
  }

  /**
   * 取消自动投票
   */
  stopVote() {
    this.appSetting.settings.background_mining = false;
  }

  /**
   * 返回所有的投票人
   * @param page
   * @param limit
   */
  async getAllVotersForMe(page = 1, limit = 10) {
    let voteForMeUrl = this.VOTE_FOR_ME;

    let data = await this.fetch.get<any>(voteForMeUrl, {
      search: {
        publicKey: this.user.publicKey,
        offset: (page - 1) * limit,
        limit: limit,
      },
    });
    if (data.success) {
      //@DDFIX
      data.unshift(0, data.length - 1);
      if (this.allVoters) {
        this.allVoters.push(...data);
      } else {
        this.allVoters = data;
      }
      return this.allVoters;
    } else {
      return this.allVoters;
    }
  }

  /**
   * 给我投票的人
   */
  voteForMe!: AsyncBehaviorSubject<TYPE.RankModel[]>;
  @ROUND_AB_Generator("voteForMe", true)
  voteForMe_Executor(promise_pro) {
    return promise_pro.follow(this.getAllVotersForMe());
  }

  /**
   * 获取我投的票
   * @param page
   * @param limit
   */
  async getMyVotes(page = 1, limit = 10) {
    let query = {
      address: this.user.userInfo.address,
      offset: (page - 1) * limit,
      limit: limit,
    };

    let data: any = await this.fetch.get<any>(this.MY_VOTES, { search: query });

    return data.delegates;
  }

  /**
   * 返回已被选中的矿工
   * 一次性获取57条，本轮不再获取
   * 返回offset + limit
   * @param page
   * @param limit
   */
  async getAllMiners(page = 1, limit = 10): Promise<TYPE.DelegateModel[]> {
    const currentRound = this.appSetting.getRound();

    if (this.allMinersInfo && this.allMinersInfo.round === currentRound) {
      return this.allMinersInfo.list.slice((page - 1) * limit, limit);
    } else {
      let query = {
        orderBy: "rate:asc",
      };
      let data = await this.fetch.get<TYPE.DelegatesResModel>(this.MINERS, {
        search: query,
      });
      this.allMinersInfo = {
        list: data.delegates,
        round: currentRound,
      };
      return this.allMinersInfo.list.slice((page - 1) * limit, limit);
    }
  }

  /**
   * 获取本轮矿工
   */
  allMinersCurRound!: AsyncBehaviorSubject<TYPE.DelegateModel[]>;
  @ROUND_AB_Generator("allMinersCurRound")
  allMinersCurRound_Executor(promise_pro) {
    return promise_pro.follow(this.getAllMiners(1, 57));
  }

  /**
   * 获取候选矿工
   * @param page
   * @param limit
   */
  async getAllMinersOutside(
    page = 1,
    limit = 10,
  ): Promise<TYPE.DelegateModel[]> {
    let query = {
      offset: 57 + (page - 1) * limit,
      limit: limit,
      orderBy: "rate:asc",
    };
    let data = await this.fetch.get<TYPE.DelegatesResModel>(this.MINERS, {
      search: query,
    });

    return data.delegates;
  }

  /**
   * 获取未被选中的矿工
   */
  minersOut!: AsyncBehaviorSubject<TYPE.DelegateModel[]>;
  @ROUND_AB_Generator("minersOut")
  minersOut_Executor(promise_pro) {
    return promise_pro.follow(this.getAllMinersOutside(1, 57));
  }

  /**
   * 返回是否在挖矿(打块)
   * @returns {Promise<void>}
   */
  async getForgeStaus() {
    let query = {
      publicKey: this.user.userInfo.publicKey,
    };
    let data = await this.fetch.get<any>(this.FORGE_STATUS, { search: query });
    return data.enabled;
  }

  /**
   * 获取输入的时间戳的完整时间戳
   * @param timestamp
   */
  getFullTimestamp(timestamp: number) {
    let seed = new Date(
      Date.UTC(
        AppSettingProvider.SEED_DATE[0],
        AppSettingProvider.SEED_DATE[1],
        AppSettingProvider.SEED_DATE[2],
        AppSettingProvider.SEED_DATE[3],
        AppSettingProvider.SEED_DATE[4],
        AppSettingProvider.SEED_DATE[5],
        AppSettingProvider.SEED_DATE[6],
      ),
    );
    let tstamp = parseInt((seed.valueOf() / 1000).toString());
    let fullTimestamp = (timestamp + tstamp) * 1000;

    return fullTimestamp;
  }

  /**
   * 获取我在上一轮的排名
   */
  async getMyRank(): Promise<TYPE.RankModel[]> {
    let query = {
      address: this.user.userInfo.address,
    };
    let data = await this.fetch.get<any>(this.MY_RANK, { search: query });

    return data.ranks || [];
  }

  myRank!: AsyncBehaviorSubject<TYPE.RankModel[]>;
  @ROUND_AB_Generator("myRank", true)
  myRank_Executor(promise_pro) {
    return promise_pro.follow(this.getMyRank());
  }

  default_rank_list_pageSize = 20;
  async getRankList(
    page = 1,
    pageSize = this.default_rank_list_pageSize,
    force_get = false,
  ): Promise<TYPE.RankModel[]> {
    if (
      page === 1 &&
      pageSize === this.default_rank_list_pageSize &&
      !force_get
    ) {
      return this.rankListOf20.getPromise();
    }
    let query = {
      page,
      pageSize,
    };
    let data = await this.fetch.get<any>(this.ALL_RANK, { search: query });

    return data.ranks || [];
  }
  // 这里只缓存最常用的初始20条
  rankListOf20!: AsyncBehaviorSubject<TYPE.RankModel[]>;
  @ROUND_AB_Generator("rankListOf20", true)
  rankListOf20_Executor(promise_pro) {
    return promise_pro.follow(this.getRankList(undefined, undefined, true));
  }

  preRoundMyBenefit!: AsyncBehaviorSubject<TYPE.RankModel | undefined>;
  @ROUND_AB_Generator("preRoundMyBenefit", true)
  preRoundMyBenefit_Executor(promise_pro) {
    return promise_pro.follow(
      this.myRank.getPromise().then(pre_round_rank_list => {
        if (pre_round_rank_list) {
          return pre_round_rank_list.find(
            rank_info => rank_info.address == this.user.userInfo.address,
          );
        }
      }),
    );
  }
  /**
   * 获取上一轮的投资回报率
   * 从rank中获取上一轮的收益，从上一轮的交易中获取手续费
   * TODO:需要后端在rank中添加手续费字段或者从其他地方获取手续费或者获取交易时可以根据轮次进行获取
   */
  async getRateOfReturn() {
    let lastRoundT = await this.transactionService.getTransactions({
      type: this.ifmJs.transactionTypes.VOTE,
      senderId: this.user.address,
      orderBy: "t_timestamp:desc",
      limit: 57,
    });

    let transactions = lastRoundT.transactions;

    let totalBenefitList = await this.myRank.getPromise();
    const myBenefit = totalBenefitList.find(
      rank_info => rank_info.address === this.user.address,
    );
    if (!myBenefit) {
      return undefined;
    }
    let totalBenefit = parseInt(myBenefit.profit);
    let totalFee = 0;
    const pre_round = this.appSetting.getRound() - 1;
    for (let i of transactions) {
      if (this.appSetting.calcRoundByHeight(i.height) == pre_round) {
        totalFee += parseFloat(i.fee);
      }
    }
    if (totalFee < 0) {
      throw new RangeError("手续费不可能为负数");
    }

    return {
      totalBenefit,
      totalFee,
      rateOfReturn: totalFee ? totalBenefit / totalFee : 0,
    } as TYPE.RateOfReturnModel;
  }

  rateOfReturn!: AsyncBehaviorSubject<TYPE.RateOfReturnModel | undefined>;
  @ROUND_AB_Generator("rateOfReturn", true)
  rateOfReturn_Executor(promise_pro) {
    return promise_pro.follow(this.getRateOfReturn());
  }

  getDelegateInfo(publicKey: string) {
    return this.fetch.get<TYPE.DelegateModel>(this.DELEGATE_INFO, {
      search: {
        publicKey,
      },
    });
  }
}
