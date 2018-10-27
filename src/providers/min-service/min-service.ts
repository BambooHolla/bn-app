import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AppFetchProvider } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject, Subscription } from "rxjs";
import { AlertController } from "ionic-angular/index";
import { AppSettingProvider, ROUND_AB_Generator, HEIGHT_AB_Generator, TB_AB_Generator, AsyncBehaviorSubject } from "../app-setting/app-setting";
import { LoginServiceProvider } from "../login-service/login-service";
import { AccountServiceProvider } from "../account-service/account-service";
import { TransactionServiceProvider, TransactionTypes, TransactionModel } from "../transaction-service/transaction-service";
import { UserInfoProvider } from "../user-info/user-info";
import { FLP_Form } from "../../../src/bnqkl-framework/FLP_Form";
import { FLP_Tool } from "../../../src/bnqkl-framework/FLP_Tool";
import { asyncCtrlGenerator, getErrorFromAsyncerror } from "../../../src/bnqkl-framework/Decorator";
import { PromiseOut, PromisePro, PromiseType } from "../../../src/bnqkl-framework/PromiseExtends";
import * as TYPE from "./min.types";
export * from "./min.types";
import { AppUrl } from "../commonService";
import { Mdb } from "../mdb";

@Injectable()
export class MinServiceProvider extends FLP_Tool {
  TransactionTypes = TransactionTypes;
  allMinersInfo?: {
    list: TYPE.DelegateModel[];
    round: number;
  };
  oneTimeUrl(app_url: AppUrl, server_url: string, force_network?: boolean) {
    app_url.disposableServerUrl(server_url);
    this.fetch.forceNetwork(force_network);
    return this;
  }
  constructor(
    public http: HttpClient,
    public fetch: AppFetchProvider,
    public translateService: TranslateService,
    public storage: Storage,
    public appSetting: AppSettingProvider,
    public accountService: AccountServiceProvider,
    public transactionService: TransactionServiceProvider,
    public userInfo: UserInfoProvider,
    public loginService: LoginServiceProvider
  ) {
    super();
    // this._auto_vote_register.getPromise();
    this.loginService.loginStatus.distinctUntilChanged().subscribe(is_login => {
      this._auto_vote_sub && this._auto_vote_sub.unsubscribe();
      if (is_login) {
        // 用户刚刚登陆的时候，清空一下缓存
        this.voted_delegates_db.clear();
        this._auto_vote_sub = this.appSetting.round.subscribe(r => {
          // 轮次变动的时候，清空已经投票的缓存
          this.voted_delegates_db.clear();
          if (this.appSetting.getUserToken()) {
            // 新的用户进来的话，界面的上的开启挖矿会自动触发vote函数，这里属于重复调用，但是autoVote会自动处理重复情况
            this.autoVote(r, "from-round-change").catch(err => {
              console.error("AUTO VOTE ERROR", err);
            });
          }
        });
      }
    });

    // 监听二次密码的变动
    this.appSetting.secondPublicKey.subscribe(async secondPublicKey => {
      // 如果已经开启自动挖矿，并且有缓存数据，检测缓存数据是否需要更新
      if (this.appSetting.settings.background_mining) {
        try {
          const perRoundPwdInfo = await this.getPerRoundPwdInfo();
          if (perRoundPwdInfo) {
            await this.refreshPerRoundPwdInfo("@@AFTER_CHANGE_PAY_PWD_AUTO_MINING_NEED_REINPUT");
          }
        } catch (err) {
          // 直接在这里停止挖矿，确保tabVotePage逻辑正确
          this.stopVote();
          this._vote_error(err);
        }
      }
    });
  }
  /*已经投票的委托人*/
  private voted_delegates_db = new Mdb<TYPE.DelegateModel>("voted_delegate", true);

  private _auto_vote_sub?: Subscription;

  readonly ROUND_TIME = this.appSetting.APP_URL("/api/delegates/roundTime");
  readonly VOTE_URL = this.appSetting.APP_URL("/api/accounts/randomAccessDelegates");
  readonly VOTE_FOR_ME = this.appSetting.APP_URL("/api/accounts/voteForDelegate");
  readonly FORGE_STATUS = this.appSetting.APP_URL("/api/delegates/forging/status");
  readonly FORGE_ENABLE = this.appSetting.APP_URL("/api/delegates/forging/enable");
  readonly FORGE_DISABLE = this.appSetting.APP_URL("/api/delegates/forging/disable");
  readonly UN_VOTE_DELEGATES = this.appSetting.APP_URL("/api/delegates/allowVotingDelegates");
  readonly VOTED_DELEGATES = this.appSetting.APP_URL("/api/delegates/alreadyVotingDelegates");
  readonly SYSTEM_SHUTDOWN = this.appSetting.APP_URL("/api/system/shutdown");
  readonly MINERS = this.appSetting.APP_URL("/api/delegates/");
  readonly DELEGATES = this.appSetting.APP_URL("/api/accounts/delegates");
  readonly MY_RANK = this.appSetting.APP_URL("/api/accounts/myProfitRanking");
  readonly ALL_RANK = this.appSetting.APP_URL("/api/accounts/profitRanking");
  readonly COUNT_BALANCE_DETAILS = this.appSetting.APP_URL("/api/accounts/countBalanceDetails");
  readonly TOTAL_VOTE = this.appSetting.APP_URL("/api/delegates/getTotalVote");
  readonly DELEGATE_INFO = this.appSetting.APP_URL("/api/delegates/get");
  readonly SYSTEM_WEBSOCKETLINKNUM = this.appSetting.APP_URL("/api/system/websocketLink");
  readonly CHECK_DELEGATE_VOTEABLE = this.appSetting.APP_URL("/api/accounts/enableBeVoted");

  getTotalVote() {
    return this.fetch.get<{ totalVoteByRound: number }>(this.TOTAL_VOTE).then(data => data.totalVoteByRound);
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
      publicKey: this.userInfo.publicKey,
    };

    let data = await this.fetch.get<{
      success: boolean;
      nextRoundTime: number;
      error?: any;
    }>(roundTimeUrl);
    const roundTime = data.nextRoundTime;
    const { timestamp } = await this.transactionService.getTimestamp();
    const roundProgress = ((1 - roundTime / ((57 * timestamp) / 1000)) * 100).toFixed(2);
    return roundProgress;
  }

  /**
   * 获取可投的委托人
   */
  async getVoteAbleDelegates(skip: number, limit: number, address = this.userInfo.address) {
    const data = await this.fetch.get<{
      delegates: TYPE.DelegateModel[];
      skip: number;
      done?: boolean;
    }>(this.UN_VOTE_DELEGATES, {
      search: {
        skip,
        limit,
        address,
      },
    });
    return data;
  }
  /**
   * 获取已投的委托人
   */
  async getVotedDelegates(skip: number, limit: number, address = this.userInfo.address) {
    const data = await this.fetch.get<{
      delegates: TYPE.DelegateModel[];
      skip: number;
      done?: boolean;
    }>(this.VOTED_DELEGATES, {
      search: {
        skip,
        limit,
        address,
      },
    });
    return data;
  }
  private _checked_voteable_delegate_cache!: Map<string, boolean>
  private voteable_delegate_cache_refresher = this.appSetting.height.subscribe(() => {
    this._checked_voteable_delegate_cache = new Map();
  });
  /**检查一组委托人是否可投*/
  async checkDelegateListVoteAble(delegate_pk_list: Iterable<string>, senderId = this.userInfo.addListener) {
    const check_result_map = new Map<string, boolean>();
    const { _checked_voteable_delegate_cache } = this;
    const need_check_delegate_pk_list: string[] = [];
    for (var delegate_pk of delegate_pk_list) {
      const voteable = _checked_voteable_delegate_cache.get(delegate_pk);
      if (typeof voteable === "boolean") {
        check_result_map.set(delegate_pk, voteable);
      } else {
        need_check_delegate_pk_list.push(delegate_pk);
      }
    }
    if (need_check_delegate_pk_list.length) {
      const { result: check_result } = await this.fetch.get<{ result: string }>(this.CHECK_DELEGATE_VOTEABLE, {
        search: {
          senderId,
          delegatePublicKeyList: need_check_delegate_pk_list.join(",")
        }
      });
      for (var i = 0; i < need_check_delegate_pk_list.length; i += 1) {
        const voteable = check_result[i] === "1";
        const delegate_pk = need_check_delegate_pk_list[i];
        _checked_voteable_delegate_cache.set(delegate_pk, voteable);
        check_result_map.set(delegate_pk, voteable);
      }
    }
    return check_result_map;
  }
  /**检查指定委托人是否可投 */
  checkDelegateVoteAble(delegate_pk: string, senderId = this.userInfo.addListener) {
    return this.checkDelegateListVoteAble([delegate_pk], senderId).then(map => map.get(delegate_pk));
  }

  /**
   * 投票
   * @param secret 主密码
   * @param secondSecret 支付密码
   */
  private async _vote(
    voteable_delegates: TYPE.DelegateModel[],
    secret: string,
    secondSecret?: string,
    fee = this.appSetting.settings.default_fee.toString(),
    publicKey = this.userInfo.publicKey
  ) {
    if (voteable_delegates.length === 0) {
      return;
    }
    if (parseFloat(fee) > parseFloat(this.userInfo.balance)) {
      if (!this.appSetting.settings._is_first_no_enough_balance_to_vote) {
        this.appSetting.settings._is_first_no_enough_balance_to_vote = await this.waitTipDialogConfirm("@@FIRST_NO_ENOUGH_BALANCE_TO_VOTE");
        throw getErrorFromAsyncerror();
      }
      throw new Error(this.getTranslateSync("NOT_ENOUGH_BALANCE_TO_VOTE"));
    }
    const voted_delegate_list = await this.voted_delegates_db.find({
      publicKey: { $in: voteable_delegates.map(del => del.publicKey) },
    });

    const votes = voteable_delegates.map(delegate => "+" + delegate.publicKey);

    //设置投票的参数
    const { timestamp } = await this.transactionService.getTimestamp();
    let txData: any = {
      type: this.TransactionTypes.VOTE,
      secret: secret,
      publicKey,
      fee,
      timestamp,
      asset: {
        votes,
      },
    };

    if (secondSecret) {
      txData.secondSecret = secondSecret;
    }

    // TODO：如果投票因为手续费过低而失败，应该根据提示的最低手续费进行投票，并将这个最低手续费进行缓存(到setting.min_auto_vote_fee中)
    //成功完成交易
    try {
      var vote_res = await this.transactionService.putTransaction(txData);
    } catch (err) {
      if (err) {
        if (err.CODE === "1100") {
          // 已经发送过投票交易了
          return;
        } else if (err.CODE === "1074" && err.details && err.details.details && err.details.details.minFee) {
          const minFee = parseFloat(err.details.details.minFee) / 1e8;
          if (isFinite(minFee) && minFee > parseFloat(fee)) {
            console.warn("手续费过低，继续重试", minFee, fee);
            return this._vote(voteable_delegates, secret, secondSecret, (Math.ceil(minFee * 1e8) / 1e8).toFixed(8), publicKey);
          }
        }
      }
      // 不是手续费的问题，继续抛出错误
      throw err;
    }
    // 存入投票记录
    await this.voted_delegates_db.insertMany(voteable_delegates).catch(err => {
      console.warn("可能存在重复投票zzz", err);
    });

    console.log("%c我挖矿了", "color:purple");
    this.appSetting.settings.digRound = this.appSetting.getRound();
    return vote_res;
  }

  /**每轮默认投出的数量*/
  default_round_vote_num = 57;
  /**
   * 自动投票
   */
  @FLP_Form.FromGlobal alertCtrl!: AlertController;
  @asyncCtrlGenerator.single()
  @asyncCtrlGenerator.error("@@AUTO_VOTE_ERROR", undefined, undefined, true)
  @FLP_Tool.translateError
  async autoVote(round, from?: any) {
    if (!this.appSetting.settings.background_mining) {
      return;
    }
    // 确保网络连接成功才发出投票
    await this.netWorkConnection();
    // 自动投票，自进行自动投57人，超过了就不投了
    const voted_delegate_list = await this.voted_delegates_db.find({}, { limit: 57 });
    if (voted_delegate_list.length >= 57) {
      if ("tab-vote-page" !== from) {
        // 直接告诉主界面投票成了
        this._vote_success();
        return;
      }
    }

    // 获取可投的账户
    const { delegates: voteable_delegates } =
      // 如果已经投过票了，自动投票模式下不会提供可投的57票
      voted_delegate_list.length !== 0 ? { delegates: [] } : await this.getVoteAbleDelegates(0, this.default_round_vote_num, this.userInfo.address);
    if (voteable_delegates.length || true) {
      // 有票可投时才需要输入要密码
      var title: string | undefined;
      if ("from-round-change" === from) {
        title = "@@AUTO_MINING_NEED_INPUT_PAY_PWD";
      } else if ("tab-vote-page" === from) {
        title = "@@START_VOTE_VERIFY";
      }
      if (title) {
        await this.getPerRoundPwdInfo();
        await this.refreshPerRoundPwdInfo(title);
      }
    }
    const pre_round_pwd_info = await this.getPerRoundPwdInfo();
    if (!pre_round_pwd_info) {
      throw new Error();
    }
    await this.tryVote(voteable_delegates, round, pre_round_pwd_info);
  }
  private _pre_round_pwd_info?: { cache_key: string } & PromiseType<ReturnType<typeof FLP_Form.prototype.getUserPassword>>;
  private _pre_round_pwd_info_block?: PromiseOut<void>;
  async refreshPerRoundPwdInfo(input_dialog_title: string) {
    const lock = new PromiseOut<void>();
    this._pre_round_pwd_info_block = lock;
    try {
      const cache_key = this.userInfo.publicKey + "|" + this.userInfo.secondPublicKey;
      if (this._pre_round_pwd_info && this._pre_round_pwd_info.cache_key != cache_key) {
        // 二次密码发生了变动，或者帐号发生了变动
        this._pre_round_pwd_info = undefined;
      }
      if (!this.userInfo.address) {
        // 如果已经没有用户处于在线状态，终止挖矿
        return;
      }
      if (!this._pre_round_pwd_info) {
        const pre_round_pwd_info = await FLP_Form.prototype.getUserPassword.call(this, {
          title: input_dialog_title,
        });
        pre_round_pwd_info.cache_key = cache_key;
        this._pre_round_pwd_info = pre_round_pwd_info;
      }
    } catch (err) {
      lock.reject(err);
    } finally {
      lock.resolve();
      this._pre_round_pwd_info_block = undefined;
    }
    return lock.promise;
  }
  async getPerRoundPwdInfo() {
    if (this._pre_round_pwd_info_block) {
      await this._pre_round_pwd_info_block.promise;
    }
    return this._pre_round_pwd_info;
  }
  /*是否处于挖矿状态*/
  vote_status = new BehaviorSubject(false);

  // 尝试自动投票
  @asyncCtrlGenerator.single()
  async tryVote(
    voteable_delegates: TYPE.DelegateModel[],
    round = this.appSetting.getRound(),
    userPWD: { password: string; pay_pwd?: string; fee?: string },
    from_page?: FLP_Form
  ) {
    await this._vote(voteable_delegates, userPWD.password, userPWD.pay_pwd, userPWD.fee)
      .then(this._vote_success.bind(this))
      .catch(this._vote_error.bind(this));
  }
  private _vote_success() {
    this.tryEmit("vote-success");
    this.vote_status_detail = null;
    this.vote_status.next(true);
  }
  private _vote_error(err) {
    this.vote_status_detail = err;

    const has_handler = this.tryEmit("vote-error", err);
    this.vote_status.next(false);
    if (!has_handler) {
      throw err;
    }
  }

  vote_status_detail: Error | string | null = null;

  /**
   * 取消自动投票
   */
  stopVote() {
    this.appSetting.settings.background_mining = false;
  }

  async getVotersForMe(page = 1, pageSize = this.default_vote_for_me_pageSize) {
    if (page === 1 && pageSize <= this.default_vote_for_me_pageSize) {
      const list = await this.voteForMe.getPromise();
      return list.slice(0, pageSize);
    }
    const data = await this._getVotersForMe(page, pageSize);
    return data.voters;
  }
  /**
   * 返回所有的投票人
   * @param page
   * @param limit
   */
  private async _getVotersForMe(page: number, pageSize: number) {
    return this.fetch.get<{
      voters: any[];
      count: number;
    }>(this.VOTE_FOR_ME, {
      search: {
        publicKey: this.userInfo.publicKey,
        offset: (page - 1) * pageSize,
        limit: pageSize,
      },
    });
  }

  default_vote_for_me_pageSize = 20;
  /**
   * 给我投票的人
   */
  voteForMe!: AsyncBehaviorSubject<TYPE.RankModel[]>;
  @HEIGHT_AB_Generator("voteForMe", true)
  voteForMe_Executor(promise_pro) {
    return promise_pro.follow(this._getVotersForMe(1, this.default_rank_list_pageSize).then(data => data.voters));
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
  async getAllMinersOutside(page = 1, limit = 10): Promise<TYPE.DelegateModel[]> {
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
  async getForgeStaus(publicKey = this.userInfo.userInfo.publicKey): Promise<boolean> {
    const data = await this.fetch.get<any>(this.FORGE_STATUS, {
      search: {
        publicKey,
      },
    });
    return data.enabled;
  }

  async enableForge(secret: string, publicKey?: string) {
    const data = await this.fetch.post<{ address: string }>(this.FORGE_ENABLE, {
      secret,
      publicKey,
    });
    return data;
  }
  async disableForge(secret: string, publicKey?: string) {
    const data = await this.fetch.post<{ address: string }>(this.FORGE_DISABLE, {
      secret,
      publicKey,
    });
    return data;
  }

  shutdownSystem() {
    return this.fetch.get(this.SYSTEM_SHUTDOWN);
  }

  getWebsocketLinkNum() {
    return this.fetch.get<{ webChannelLinkNum: number }>(this.SYSTEM_WEBSOCKETLINKNUM).then(res => res.webChannelLinkNum);
  }

  /**
   * 获取我在上一轮的排名
   */
  async getMyRank(before = 1, after = 1): Promise<TYPE.RankModel[]> {
    const query = {
      before,
      after,
      address: this.userInfo.userInfo.address,
    };
    const data = await this.fetch.get<any>(this.MY_RANK, { search: query });

    return data.profits || [];
  }

  myRank!: AsyncBehaviorSubject<TYPE.RankModel[]>;
  @ROUND_AB_Generator("myRank", true)
  myRank_Executor(promise_pro) {
    return promise_pro.follow(this.getMyRank(1, 2 /*如果自己是第一名，要确保第三名也拿到*/).then(list => list.slice(0, 3)));
  }

  bigRankList!: AsyncBehaviorSubject<TYPE.RankModel[]>;
  @ROUND_AB_Generator("bigRankList", true)
  async bigRankList_Executor(promise_pro: PromisePro<TYPE.RankModel[]>) {
    const myRank = await this.myRank.getPromise();
    const rank = myRank.findIndex(r => r.address === this.userInfo.address);
    const ext_num = 40;
    const before = Math.max(rank, 0);
    const after = ext_num - rank;
    return promise_pro.follow(this.getMyRank(before, after));
  }

  default_rank_list_pageSize = 20;
  async getRankList(page = 1, pageSize = this.default_rank_list_pageSize, force_get = false): Promise<TYPE.RankModel[]> {
    if (page === 1 && pageSize === this.default_rank_list_pageSize && !force_get) {
      return this.rankListOf20.getPromise();
    }
    let query = {
      page,
      pageSize,
    };
    let data = await this.fetch.get<any>(this.ALL_RANK, { search: query });

    return data.profits || [];
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
          return pre_round_rank_list.find(rank_info => rank_info.address == this.userInfo.userInfo.address);
        }
      })
    );
  }

  /**获取指定用户在高度范围内的挖矿收益*/
  countAccountBalanceDetails(
    address: string,
    search: {
      startHeight?: number;
      endHeight?: number;
      /**TODO: add BalanceDetailType enum*/
      type?: number;
    }
  ) {
    return this.fetch
      .get<{ countBalanceDetails: string }>(this.COUNT_BALANCE_DETAILS, {
        search: { ...search, address },
      })
      .then(data => data.countBalanceDetails);
  }

  /**
   * 获取上一轮的投资回报率
   * 从rank中获取上一轮的收益，从上一轮的交易中获取手续费
   * TODO:需要后端在rank中添加手续费字段或者从其他地方获取手续费或者获取交易时可以根据轮次进行获取
   */
  async getRateOfReturn() {
    /// 1. 查询上一轮的所有的投票交易

    const cur_round = this.appSetting.getRound();
    const pre_round = cur_round - 1;
    const transactions: TransactionModel[] = [];
    const pageSize = 59; // 一般不会超过57，这里考虑到自动投票+手动投57个来方便一次性查询处理啊
    let offset = 0;
    do {
      const preRoundVoteTrs = await this.transactionService.queryTransaction(
        {
          senderId: this.userInfo.address,
          height: {
            $lt: this.appSetting.getRoundStartHeight(cur_round),
            $gte: this.appSetting.getRoundStartHeight(pre_round),
          },
          type: TransactionTypes.VOTE,
        },
        {},
        offset,
        pageSize
      );
      transactions.push(...preRoundVoteTrs.transactions);
      // 查询到了尽头，不查了
      if (preRoundVoteTrs.transactions.length < pageSize) {
        break;
      }
      offset += pageSize;
    } while (true);
    // 累计所有投票交易的手续费
    let totalFee = 0;
    for (var trs of transactions) {
      totalFee += parseFloat(trs.fee);
    }
    if (totalFee < 0) {
      throw new RangeError("手续费不可能为负数");
    }

    /// 2. 查询上一轮的所有挖矿收入
    const totalBenefitList = await this.myRank.getPromise();
    const myBenefit = totalBenefitList.find(rank_info => rank_info.address === this.userInfo.address);
    if (!myBenefit) {
      return undefined;
    }
    const totalBenefit = parseInt(myBenefit.profit);

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
    return this.fetch
      .get<TYPE.DelegateInfoResModel>(this.DELEGATE_INFO, {
        search: {
          publicKey,
        },
      })
      .then(data => data.delegate);
  }
  getDelegateInfoByAddress(address: string) {
    return this.fetch
      .get<TYPE.DelegateInfoResModel>(this.DELEGATE_INFO, {
        search: {
          address,
        },
      })
      .then(data => data.delegate);
  }
  myDelegateInfo!: AsyncBehaviorSubject<TYPE.DelegateModel | null>;
  @HEIGHT_AB_Generator("myDelegateInfo", true)
  myDelegateInfo_Executor(promise_pro) {
    return promise_pro.follow(this.getDelegateInfo(this.userInfo.publicKey).catch(() => null));
  }
}
