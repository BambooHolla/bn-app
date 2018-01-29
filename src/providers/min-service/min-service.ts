import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AppFetchProvider } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject } from "rxjs";
import { AppSettingProvider } from "../app-setting/app-setting";
import { BlockServiceProvider } from "../block-service/block-service";
import { AccountServiceProvider } from "../account-service/account-service";
import { TransactionServiceProvider } from "../transaction-service/transaction-service";
import { UserInfoProvider } from "../user-info/user-info";
import * as IFM from "ifmchain-ibt";
import { DelegateModel } from "./min.types";
export * from "./min.types";

/*
  Generated class for the MinServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class MinServiceProvider {
  ifmJs: any;
  transactionTypes: any;
  allVoters: string[];
  allMiners: DelegateModel[];
  allMinersRound: number;
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
    this.ifmJs = AppSettingProvider.IFMJS;
    this.transactionTypes = this.ifmJs.transactionTypes;
  }

  readonly ROUND_TIME = "/api/delegates/roundTime";
  readonly VOTE_URL = "/api/accounts/randomAccessDelegates";
  readonly VOTE_FOR_ME = "/api/accounts/voteForDelegate";
  readonly FORGE_STATUS = "/api/delegates/forging/status";
  readonly MY_VOTES = "/api/delegates";
  readonly MY_RANK = "/api/accounts/profitRanking";

  /**
   * 获取本轮剩余时间
   * @returns {Promise<void>}
   */
  async getRoundRemainTime() {
    let roundTimeUrl = this.appSetting.APP_URL(this.ROUND_TIME);
    let roundTimeReq = {
      publicKey: this.user.userInfo.publicKey,
    };
    let roundProgress: any;

    let roundTimeData = await this.fetch.get<{
      success: boolean;
      nextRoundTime: number;
    }>(roundTimeUrl);
    if (roundTimeData.success) {
      let roundTime = roundTimeData.nextRoundTime;
      let blockTimeRes = await this.transactionService.getTimestamp();
      if (blockTimeRes.success) {
        let blockTime = blockTimeRes.timestamp;
        roundProgress = (
          (1 - roundTime / (57 * blockTime / 1000)) *
          100
        ).toFixed(2);
        return roundProgress;
      }
    }
    return roundProgress;
  }

  /**
   * 获取块剩余时间
   * 返回大于0说明块正常打块
   * 返回-1说明块延迟
   * @returns {Promise<void>}
   */
  async getBlockRemainTime() {
    let lastBlock: any = this.blockService.getLastBlock();

    let lastBlockTime = lastBlock.timestamp;
    let lastTime = this.getFullTimestamp(lastBlockTime);
    let currentTime = new Date().getTime();
    if (currentTime - lastTime > 12800) {
      return -1;
    } else {
      let percent = Math.floor((currentTime - lastTime) / 128) * 100;
      return percent;
    }
  }

  /**
   * 获取当前轮次
   */
  async getRound() {
    let currentBlock: any = await this.blockService.getLastBlock();
    if (currentBlock.height) {
      return Math.floor(currentBlock.height / 57);
    }
  }

  /**
   * 投票
   * @param secret 主密码
   * @param secondSecret 支付密码
   */
  async vote(secret: string, secondSecret?: string) {
    //首先获取时间戳
    let voteTimestamp = await this.transactionService.getTimestamp();
    if (voteTimestamp.success) {
      let vote_url = this.appSetting.APP_URL(this.VOTE_URL);
      //获取投票的人
      const resp = await this.fetch.get<any>(vote_url, {
        search: { address: this.user.address },
      });
      if (!resp.success) {
        throw resp.error.message;
      }
      //如果没有可投票的人，一般都是已经投了57票
      if (resp.delegate.length === 0) {
        throw "you have already voted";
      } else {
        let delegateArr = resp.delegate;
        let voteList = [];
        //票投给所有获取回来的人
        for (let i in delegateArr) {
          voteList.push("+" + delegateArr[i]);
        }

        //设置投票的参数
        let txData = {
          type: this.transactionTypes.VOTE,
          secret: secret,
          publicKey: this.user.userInfo.publicKey,
          fee: this.appSetting.settings.default_fee,
          timestamp: resp.timestamp,
          asset: {
            votes: voteList,
          },
          secondSecret,
        };

        if (secondSecret) {
          txData.secondSecret = secondSecret;
        }

        //成功完成交易
        let isDone: boolean = await this.transactionService.putTransaction(
          txData,
        );
        if (isDone) {
          // let saveObj = {
          //   autoDig: true,
          //   digRound: await this.getRound(),
          // };
          // await this.user.saveUserSettings(saveObj, this.user.address);
          this.appSetting.settings.digRound = await this.getRound();
          this.appSetting.settings.background_mining = true;
        } else {
          throw "vote transaction error";
        }
      }
    } else {
      throw "get transaction timestamp error";
    }
  }

  /**
   * 返回所有的投票人
   * @param page
   * @param limit
   */
  async getAllVotersForMe(page = 1, limit = 10) {
    let voteForMeUrl = this.appSetting.APP_URL(this.VOTE_FOR_ME);

    let data = await this.fetch.get<any>(voteForMeUrl);
    if (data.success) {
      data.unshift(0, data.length - 1);
      Array.prototype.push.apply(this.allVoters, data);
      return this.allVoters;
    } else {
      return this.allVoters;
    }
  }

  /**
   * 获取我投的票
   * @param page
   * @param limit
   */
  async getMyVotes(page = 1, limit = 10) {
    let myVotesUrl = this.appSetting.APP_URL(this.MY_VOTES);

    let query = {
      address: this.user.userInfo.address,
      offset: (page - 1) * limit,
      limit: limit,
    };

    let data: any = this.fetch.get<any>(myVotesUrl, { search: query });
    if (data.success) {
      return data.delegates;
    } else {
      console.log("get my votes error");
    }
  }

  /**
   * 返回已被选中的矿工
   * 一次性获取57条，本轮不再获取
   * 返回offset + limit
   * @param page
   * @param limit
   */
  async getAllMiners(page = 1, limit = 10): Promise<DelegateModel[]> {
    let myVotesUrl = this.appSetting.APP_URL(this.MY_VOTES);

    let currentBlock = await this.blockService.getLastBlock();
    let currentRound = Math.floor(currentBlock.height / 57);

    if (currentRound != this.allMinersRound) {
      let query = {
        orderBy: "rate:asc",
      };
      let data = await this.fetch.get<any>(myVotesUrl, { search: query });
      if (data.success) {
        this.allMiners = data.delegates;
        this.allMinersRound = currentRound;
        return this.allMiners.slice((page - 1) * limit, limit);
      } else {
        return [];
      }
    } else {
      return this.allMiners.slice((page - 1) * limit, limit);
    }
  }

  /**
   * 获取候选矿工
   * @param page
   * @param limit
   */
  async getAllMinersOutside(page = 1, limit = 10) {
    let minersUrl = this.appSetting.APP_URL(this.MY_VOTES);

    let query = {
      offset: 57 + (page - 1) * limit,
      limit: limit,
      orderBy: "rate:asc",
    };
    let data = await this.fetch.get<any>(minersUrl, { search: query });

    if (data.success) {
      return data.delegates;
    } else {
      console.log("get all miners outside error");
    }
  }

  /**
   * 返回是否在挖矿(打块)
   * @returns {Promise<void>}
   */
  async getForgeStaus() {
    let forgeStatusUrl = this.appSetting.APP_URL(this.FORGE_STATUS);

    let query = {
      publicKey: this.user.userInfo.publicKey,
    };
    let data = await this.fetch.get<any>(forgeStatusUrl, { search: query });
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
    let tstamp = parseInt((Date.now() / 1000).toString());
    let fullTimestamp = (timestamp + tstamp) * 1000;

    return fullTimestamp;
  }

  /**
   * 获取我在上一轮的排名
   */
  async getMyRank() {
    let myRankUrl = this.appSetting.APP_URL(this.MY_RANK);

    let query = {
      address: this.user.userInfo.address,
    };
    let data = await this.fetch.get<any>(myRankUrl, { search: query });

    if (data.success) {
      return data.ranks;
    }
  }
}
