import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
  AppSettingProvider,
  AsyncBehaviorSubject,
  ROUND_AB_Generator,
} from "../app-setting/app-setting";
import { AppFetchProvider, CommonResponseData } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import {
  TransactionServiceProvider,
  TransactionTypes,
} from "../transaction-service/transaction-service";
import { UserInfoProvider } from "../user-info/user-info";
import * as TYPE from "./account.types";
export * from "./account.types";
import { Observable, BehaviorSubject } from "rxjs";
import { Mdb } from "../mdb";
import { DbCacheProvider } from "../db-cache/db-cache";
import { FLP_Tool } from "../../bnqkl-framework/FLP_Tool";

@Injectable()
export class AccountServiceProvider {
  TransactionTypes = TransactionTypes;
  get keypair() { return AppSettingProvider.IFMJSCORE.keypair(); }
  md5: any;
  sha: any;
  nacl: any;

  accountDb: Mdb<TYPE.AccountModel>;

  constructor(
    public http: HttpClient,
    public translateService: TranslateService,
    public appSetting: AppSettingProvider,
    public fetch: AppFetchProvider,
    public transactionService: TransactionServiceProvider,
    public user: UserInfoProvider,
    public dbCache: DbCacheProvider
  ) {
    // this.md5 = this.Crypto.createHash("md5"); //Crypto.createHash('md5');
    // this.sha = this.Crypto.createHash("sha256"); //Crypto.createHash('sha256');
    this.accountDb = this.dbCache.installDatabase("account", [
      {
        fieldName: "address",
        unique: true,
      },
      {
        fieldName: "publicKey",
        unique: true,
      },
    ]);

    [this.GET_USER, this.GET_USER_BY_USERNAME].forEach(api_url => {
      this.dbCache.installApiCache<TYPE.AccountModel, TYPE.AccountResModel>(
        "account",
        "get",
        api_url,
        async (db, request_opts) => {
          if (this.fetch.onLine) {
            return {
              reqs: [request_opts],
              cache: {
                success: false,
                account: undefined as any,
                error: { message: "Account not found" },
              },
            };
          } else {
            const query = request_opts.reqOptions.search;
            const cache_account = await db.findOne(query);
            const cache = {
              account: cache_account,
              success: true,
            } as TYPE.AccountResModel;
            if (cache_account) {
              return { reqs: [], cache };
            }
            return { reqs: [request_opts], cache };
          }
        },
        async req_res_list => {
          if (req_res_list.length > 0) {
            return req_res_list[0].result;
          }
        },
        async (db, mix_res, cache) => {
          if (mix_res) {
            const new_account = mix_res.account;
            if (
              (await db.update(
                { address: new_account.address },
                new_account
              )) === 0
            ) {
              await db.insert(new_account);
            }
            // cache.account = new_account;
            return mix_res;
          }
          return cache;
        }
      );
    });
  }

  readonly GET_USER = this.appSetting.APP_URL("/api/accounts/");
  readonly GET_USER_BY_USERNAME = this.appSetting.APP_URL(
    "/api/accounts/username/get"
  );
  readonly GET_ACCOUNT_PROFITS = this.appSetting.APP_URL(
    "/api/accounts/accountProfits"
  );

  /**上轮是否有投票*/
  async isPreRoundHasVote(address: string) {
    const cur_round = this.appSetting.getRound();
    const data = await this.transactionService.queryTransaction(
      {
        height: {
          $lt: this.appSetting.getRoundStartHeight(cur_round),
          $gte: this.appSetting.getRoundStartHeight(cur_round - 1),
        },
        type: TransactionTypes.VOTE,
      },
      {},
      0,
      1
    );

    return data.transactions.length !== 0;
  }
  is_pre_round_has_vote!: AsyncBehaviorSubject<boolean>;
  @ROUND_AB_Generator("is_pre_round_has_vote", true)
  is_pre_round_has_vote_Executor(promise_pro) {
    return promise_pro.follow(this.isPreRoundHasVote(this.user.address));
  }

  /**
   * 根据地址获取账户信息
   * @param {string} address
   * @returns {Promise<any>}
   */
  async getAccountByAddress(address: string) {
    const data = await this.fetch.get<TYPE.AccountResModel>(this.GET_USER, {
      search: { address },
    });
    return data.account;
  }

  /**
   * 根据用户名获取账户信息
   * @param {string} username
   * @returns {Promise<any>}
   */
  async getAccountByUsername(username: string) {
    const data = await this.fetch.get<TYPE.AccountResModel>(
      this.GET_USER_BY_USERNAME,
      {
        search: { username },
      }
    );

    return data.account;
  }

  checkUsernameExisted(username: string) {
    return this.getAccountByUsername(username)
      .then((data: any) => {
        if (Object.keys(data.account).length === 0) {
          return true;
        }
        return false;
      })
      .catch(() => true);
  }

  /**
   *  更改用户名
   *  @param {string} newUsername
   */
  async changeUsername(
    newUsername: string,
    secret: string,
    secondSecret?: string,
    fee = parseFloat(this.appSetting.settings.default_fee)
  ) {
    if (!!this.user.userInfo.username) {
      throw this.fetch.ServerResError.getI18nError(
        "account already has username"
      );
    }
    const is_existed = await this.checkUsernameExisted(newUsername);
    if (!is_existed) {
      throw this.fetch.ServerResError.getI18nError(
        "this username has already exist"
      );
    }
    const accountData: any = {
      type: TransactionTypes.USERNAME,
      secret,
      publicKey: this.user.userInfo.publicKey,
      fee: fee.toString(),
      asset: {
        username: {
          alias: newUsername,
          publicKey: this.user.userInfo.publicKey,
        },
      },
    };

    if (secondSecret) {
      accountData.secondSecret = secondSecret;
    }

    // try {
    await this.transactionService.putTransaction(accountData);
    // this.user.userInfo.username = newUsername;
    return true;
    // } catch (err) {
    //   throw this.fetch.ServerResError.getI18nError("change username error");
    // }
  }

  /**
   * 生成密码
   * @param options 传入的选项，都没有的话返回纯粹的生成密码
   * @param lang 默认语言
   */
  generateCryptoPassword(options: object, lang: string) {
    return this.keypair.generatePassphrase(lang, options);
  }

  getAccountPreRoundProfits(address: string, page: number, pageSize: number) {
    return this.fetch.get<TYPE.AccountProfitsResModel>(
      this.GET_ACCOUNT_PROFITS,
      {
        search: {
          offset: (page - 1) * pageSize,
          limit: pageSize,
          address,
          orderBy: "round:desc",
        },
      }
    );
  }

  /**
   * 设置支付密码
   * @param {string} secondScret
   */
  @FLP_Tool.translateError
  async setSecondPassphrase(
    secret: string,
    newSecondSecret: string,
    oldSecondSecret?: string,
    fee = parseFloat(this.appSetting.settings.default_fee),
    publicKey = this.user.publicKey
  ) {
    let txData = {
      type: this.TransactionTypes.SIGNATURE,
      asset: {
        signature: {
          publicKey,
        },
      },
      secret,
      secondSecret: oldSecondSecret ? oldSecondSecret : newSecondSecret,
      newSecondSecret: oldSecondSecret ? newSecondSecret : undefined,
      publicKey,
      fee: fee.toString(),
    };

    await this.transactionService.putTransaction(txData);
    return true;
  }
}
