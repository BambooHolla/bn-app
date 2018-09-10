import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AppFetchProvider } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject } from "rxjs";
import {
  AppSettingProvider,
  ROUND_AB_Generator,
  HEIGHT_AB_Generator,
  AsyncBehaviorSubject,
} from "../app-setting/app-setting";
import { AlertController } from "ionic-angular";
import { UserInfoProvider } from "../user-info/user-info";
import { tryRegisterGlobal } from "../../bnqkl-framework/FLP_Tool";
import { sleep } from "../../bnqkl-framework/PromiseExtends";
import * as TYPE from "./transaction.types";
export * from "./transaction.types";
import * as promisify from "es6-promisify";
import { Mdb } from "../mdb";
// const { TransactionTypes } = TYPE;
export * from "./transaction.types";

@Injectable()
export class TransactionServiceProvider {
  ifmJs = AppSettingProvider.IFMJS;
  transaction: any;
  // block: any;
  TransactionTypes = TYPE.TransactionTypes;
  nacl_factory: any;
  Buff: any;
  Crypto: any;
  md5: any;
  sha: any;
  nacl: any;
  keypairService: any;
  addresssCheck: any;
  unTxDb = new Mdb<TYPE.TransactionModel>("unconfirm_transaction");
  constructor(
    public http: HttpClient,
    public appSetting: AppSettingProvider,
    public storage: Storage,
    public translateService: TranslateService,
    public alertController: AlertController,
    public fetch: AppFetchProvider,
    public user: UserInfoProvider
  ) {
    tryRegisterGlobal("transactionService", this);
    this.transaction = this.ifmJs.Api(
      AppSettingProvider.HTTP_PROVIDER
    ).transaction;
    // this.block = this.ifmJs.Api(AppSettingProvider.HTTP_PROVIDER).block;
    this.nacl_factory = this.ifmJs.nacl_factory;
    this.Crypto = this.ifmJs.crypto;
    this.Buff = this.ifmJs.Buff;
    // this.md5 = this.Crypto.createHash("md5"); //Crypto.createHash('md5');
    // this.sha = this.Crypto.createHash("sha256"); //Crypto.createHash('sha256');
    this.keypairService = this.ifmJs.keypairHelper; //For verify passphrase
    this.addresssCheck = this.ifmJs.addressCheck;
  }

  readonly UNCONFIRMED = this.appSetting.APP_URL(
    "/api/transactions/unconfirmed"
  );
  readonly GET_TRANSACTIONS_BY_ID = this.appSetting.APP_URL(
    "/api/transactions/get"
  );
  readonly GET_TIMESTAMP = this.appSetting.APP_URL(
    "/api/transactions/getslottime"
  );
  readonly GET_TRANSACTIONS = this.appSetting.APP_URL("/api/transactions/");
  readonly QUERY_TRANSACTIONS = this.appSetting.APP_URL(
    "/api/transactions/query"
  );
  readonly GET_SOURCE_IP = this.appSetting.APP_URL("/api/system/sourceIp");

  getTransactionLink(type) {
    switch (type) {
      case this.TransactionTypes.SEND:
        return "transactions/tx";
      //“签名”交易
      case this.TransactionTypes.SIGNATURE:
        return "signatures/tx";
      //注册为受托人
      case this.TransactionTypes.DELEGATE:
        return "delegates/tx";
      //投票
      case this.TransactionTypes.VOTE:
        return "accounts/tx/delegates";
      //注册用户别名地址
      case this.TransactionTypes.USERNAME:
        return "accounts/tx/username";
      //添加联系人
      case this.TransactionTypes.FOLLOW:
        return "contacts/tx";
      //注册多重签名帐号
      case this.TransactionTypes.MULTI:
        return "multisignatures/tx";
      // 侧链应用
      case this.TransactionTypes.DAPP:
        return "dapps/tx";
      // //转入Dapp资金
      // case transactionTypes.IN_TRANSFER:
      //     return "xxxxx"
      // //转出Dapp资金
      // case transactionTypes.OUT_TRANSFER:
      // return "xxxxx"
      //点赞
      case this.TransactionTypes.FABULOUS:
        return "fabulous/tx";
      //打赏
      case this.TransactionTypes.GRATUITY:
        return "gratuities/tx";
      //发送信息
      case this.TransactionTypes.SENDMESSAGE:
        return "messages/tx";
      //侧链数据存证
      case this.TransactionTypes.MARK:
        return "marks/tx";
      //申请数字资产
      case this.TransactionTypes.ISSUE_ASSET:
        return "assets/tx/issuedAsset";
      //销毁数字资产
      case this.TransactionTypes.DESTORY_ASSET:
        return "assets/tx/destoryAsset";
      //数字资产转账
      case this.TransactionTypes.TRANSFER_ASSET:
        return "assets/tx";
    }
  }

  /**是否是转账交易*/
  isTransferType(type: TYPE.TransactionTypes) {
    return (
      type === TYPE.TransactionTypes.TRANSFER_ASSET ||
      type === TYPE.TransactionTypes.SEND
    );
  }

  /**是否是转账交易*/
  isShowAmountType(type: TYPE.TransactionTypes) {
    return (
      this.isTransferType(type) || type === TYPE.TransactionTypes.DESTORY_ASSET
    );
  }

  /**
   * 根据交易ID获取交易信息
   * @param {string} id
   * @returns {Promise<any>}
   */
  async getTransactionById(id: string) {
    let data = await this.fetch.get<{ transaction: TYPE.TransactionModel }>(
      this.GET_TRANSACTIONS_BY_ID,
      {
        search: {
          id: id,
        },
      }
    );

    return data.transaction;
  }

  async getUnconfirmedById(id: string) {
    let data = await this.fetch.get<{
      transactions: TYPE.TransactionModel[];
    }>(this.UNCONFIRMED, {
      search: {
        id: id,
      },
    });

    return data.transactions[0];
  }

  /**
   * 获取交易时间，交易所需
   */
  async getTimestamp() {
    const t = AppSettingProvider.seedDateTimestamp;

    const now = Math.floor(Date.now() / 1000);
    return {
      timestamp: now - t,
    };
  }

  getSourceIp() {
    if (this.fetch.onLine) {
      return Promise.race([
        this.fetch.get<{ sourceIp: string }>(this.GET_SOURCE_IP).then(data => {
          localStorage.setItem("sourceIp", data.sourceIp);
          return data.sourceIp;
        }),
        sleep(5e3).then(() => ""),
      ]);
    } else {
      return localStorage.getItem("sourceIp") || "";
    }
  }

  async createTransaction(txData) {
    if (
      txData.secondSecret &&
      txData.type !== this.TransactionTypes.SIGNATURE
    ) {
      let secondPwd = txData.secondSecret;
      let is_second_true = this.verifySecondPassphrase(secondPwd);
      if (!is_second_true) {
        throw this.fetch.ServerResError.getI18nError(
          "Second passphrase verified error"
        );
      }
    }
    if (typeof txData.fee === "number") {
      txData.fee = txData.fee.toFixed(8);
    }

    if (!this.validateTxdata(txData)) {
      throw this.fetch.ServerResError.getI18nError("validate error");
    }
    //获取url，获取类型
    let transactionUrl = this.appSetting.APP_URL(
      "/api/" + this.getTransactionLink(txData.type)
    );

    //时间戳加入转账对象
    txData.timestamp = (await this.getTimestamp()).timestamp;
    // 加入ip地址
    txData.sourceIP = await this.getSourceIp();
    txData.magic = AppSettingProvider.MAGIC;

    //生成转账        await上层包裹的函数需要async
    const transaction = await new Promise<TYPE.TransactionModel>(
      (resolve, reject) => {
        try {
          this.ifmJs.transaction.createTransaction(txData, (err, res) => {
            if (err) {
              return reject(err);
            }
            resolve(res);
          });
        } catch (err) {
          reject(err);
        }
      }
    );

    return { transactionUrl, transaction };
  }

  /**
   * 交易请求，发送
   * @param txData
   * @returns {Promise<boolean>}
   */
  async putTransaction(txData) {
    const { transactionUrl, transaction } = await this.createTransaction(
      txData
    );
    if (await this.unTxDb.findOne({ id: transaction.id })) {
      // 重复交易不发送
      return { success: true, transactionId: transaction.id };
    }
    await this.unTxDb.insert(transaction).catch(err => {
      console.warn;
    });
    return this.fetch.put<TYPE.putTransactionReturn>(
      transactionUrl,
      transaction
    );
  }
  async putThirdTransaction(transaction: TYPE.TransactionModel) {
    let transactionUrl = this.appSetting.APP_URL(
      "/api/" + this.getTransactionLink(transaction.type)
    );
    return this.fetch.put<TYPE.putTransactionReturn>(
      transactionUrl,
      transaction
    );
  }

  /**
   * 验证交易类型
   * @param txData
   * @returns {boolean}
   */
  validateTxdata(txData) {
    if (txData) {
      if (!txData.type && txData.type !== 0) {
        console.error("transaction type error");
        return false;
      }

      if (!txData.secret) {
        console.error("transaction secret error");
        return false;
      }

      if (
        (txData.type === this.TransactionTypes.SEND && !txData.recipientId) ||
        (txData.type === this.TransactionTypes.SEND && !txData.amount)
      ) {
        console.error("tx is send and recipient is null");
        return false;
      }
      if (!txData.fee) {
        console.error("tx fee type error");
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * 验证支付密码
   * @param: secondPassphrase 输入的二次密码
   */
  verifySecondPassphrase(secondPassphrase: string) {
    try {
      var secondPublic = this.formatSecondPassphrase(
        this.user.publicKey,
        secondPassphrase
      );
    } catch (err) {
      return false;
    }
    console.log(secondPublic.publicKey.toString("hex"));
    if (secondPublic.publicKey.toString("hex") === this.user.secondPublicKey) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * 将输入的支付密码转换为publicKey
   * @param publicKey
   * @param secondSecret
   * @returns {any}
   */
  formatSecondPassphrase(publicKey, secondSecret) {
    //设置
    if (!this.nacl) {
      this.nacl_factory.instantiate(tmpNacl => {
        this.nacl = tmpNacl;
      });
    }

    let reg = /^[^\s]+$/;
    if (!reg.test(secondSecret)) {
      throw new TypeError("Second Secret cannot contain spaces");
    }

    let pattern = /^[^\u4e00-\u9fa5]+$/;
    if (!pattern.test(secondSecret)) {
      throw new TypeError("Second Secret cannot contain Chinese characters");
    }

    let md5Second =
      publicKey.toString().trim() +
      "-" +
      this.Crypto.createHash("md5")
        .update(secondSecret.toString().trim())
        .digest("hex");
    let secondHash = this.Crypto.createHash("sha256")
      .update(md5Second, "utf-8")
      .digest();
    let secondKeypair = this.nacl.crypto_sign_seed_keypair(secondHash);
    secondKeypair.publicKey = this.Buff.from(secondKeypair.signPk);
    secondKeypair.privateKey = this.Buff.from(secondKeypair.signSk);
    return secondKeypair;
  }
  async getUserTransactions(
    address: string,
    page = 1,
    pageSize = 10,
    in_or_out?: "in" | "out" | "or",
    type?: TYPE.TransactionTypes | "all"
  ) {
    const offset = (page - 1) * pageSize;
    const limit = pageSize;
    if (
      address === this.user.address &&
      in_or_out === "in" &&
      offset + limit <= this.default_user_in_transactions_pageSize
    ) {
      const list = await this.myInTransactions.getPromise();
      return list.slice(offset, offset + limit);
    }
    if (
      address === this.user.address &&
      in_or_out === "out" &&
      offset + limit <= this.default_user_out_transactions_pageSize
    ) {
      const list = await this.myOutTransactions.getPromise();
      return list.slice(offset, offset + limit);
    }
    return this._getUserTransactions(address, offset, limit, in_or_out, type);
  }
  /**
   * 根据地址获得交易，分页，send:true为转出
   * @param {string} address
   * @param {boolean} send    true为转出，false为转入
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<any>}
   */
  private async _getUserTransactions(
    address: string,
    offset: number,
    limit: number,
    in_or_out?: "in" | "out" | "or",
    type?: TYPE.TransactionTypes | TYPE.TransactionTypes[] | "all",
    extend_query: any = {}
  ) {
    let type_query_condition: any = {
      $in: [this.TransactionTypes.SEND, this.TransactionTypes.TRANSFER_ASSET],
    };
    if (type instanceof Array) {
      type_query_condition.$in = type;
    } else if (type === "all") {
      type_query_condition = undefined;
    } else if (typeof type !== "undefined") {
      type_query_condition = type;
    }

    if (in_or_out !== "or") {
      // const data = await this.getTransactions({
      //   senderId: in_or_out !== "in" ? address : undefined,
      //   recipientId: in_or_out !== "out" ? address : undefined,
      //   offset,
      //   limit,
      //   orderBy: "t_timestamp:desc",
      //   type,
      //   ...extend_query,
      // });
      const data = await this.queryTransaction(
        {
          senderId: in_or_out !== "in" ? address : undefined,
          recipientId: in_or_out !== "out" ? address : undefined,
          type: type_query_condition,
          ...extend_query,
        },
        {
          dealDateTime: -1,
        },
        offset,
        limit
      );
      return data.transactions;
    } else {
      const data = await this.queryTransaction(
        {
          $or: [{ senderId: address }, { recipientId: address }],
          type: type_query_condition,
          ...extend_query,
        },
        {
          dealDateTime: -1,
        },
        offset,
        limit
      );
      return data.transactions;
    }
  }
  // 默认缓存10条
  default_user_in_transactions_pageSize = 10;
  default_user_in_transactions_type = [
    TYPE.TransactionTypes.SEND,
    TYPE.TransactionTypes.TRANSFER_ASSET,
  ];
  myInTransactions!: AsyncBehaviorSubject<TYPE.TransactionModel[]>;
  @HEIGHT_AB_Generator("myInTransactions", true)
  myInTransactions_Executor(promise_pro) {
    return promise_pro.follow(
      this._getUserTransactions(
        this.user.address,
        0,
        this.default_user_in_transactions_pageSize,
        "in",
        this.default_user_in_transactions_type
      )
    );
  }
  default_user_out_transactions_pageSize = 10;
  default_user_out_transactions_type = [
    TYPE.TransactionTypes.SEND,
    TYPE.TransactionTypes.TRANSFER_ASSET,
  ];
  myOutTransactions!: AsyncBehaviorSubject<TYPE.TransactionModel[]>;
  @HEIGHT_AB_Generator("myOutTransactions", true)
  myOutTransactions_Executor(promise_pro) {
    return promise_pro.follow(
      this._getUserTransactions(
        this.user.address,
        0,
        this.default_user_out_transactions_pageSize,
        "out",
        this.default_user_out_transactions_type
      )
    );
  }

  /// 上一轮的交易
  async getUserTransactionsPreRound(
    address: string,
    page = 1,
    pageSize = 10,
    in_or_out: "in" | "out",
    type?: TYPE.TransactionTypes | TYPE.TransactionTypes[]
  ) {
    const offset = (page - 1) * pageSize;
    const limit = pageSize;
    if (
      address === this.user.address &&
      in_or_out === "in" &&
      offset + limit <= this.default_user_in_transactions_pageSize &&
      `${type}` == `${this.default_user_in_transactions_type}`
    ) {
      const list = await this.myInTransactionsPreRound.getPromise();
      return list.slice(offset, offset + limit);
    }
    if (
      address === this.user.address &&
      in_or_out === "out" &&
      offset + limit <= this.default_user_out_transactions_pageSize &&
      `${type}` == `${this.default_user_out_transactions_type}`
    ) {
      const list = await this.myOutTransactionsPreRound.getPromise();
      return list.slice(offset, offset + limit);
    }
    const cur_round = this.appSetting.getRound();
    const per_round_start_height = this.appSetting.getRoundStartHeight(
      cur_round - 1
    );
    const pre_round_end_height =
      this.appSetting.getRoundStartHeight(cur_round) - 1;
    return this._getUserTransactions(address, offset, limit, in_or_out, type, {
      height: { $lte: pre_round_end_height, $gte: per_round_start_height },
    });
  }
  /**
   * 根据地址获得交易，分页，send:true为转出
   * @param {string} address
   * @param {boolean} send    true为转出，false为转入
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<any>}
   */
  private async _getUserTransactionsPreRound(
    address: string,
    offset: number,
    limit: number,
    in_or_out: "in" | "out",
    type?: TYPE.TransactionTypes | TYPE.TransactionTypes[]
  ) {
    const cur_round = this.appSetting.getRound();
    const startHeight = this.appSetting.getRoundStartHeight(cur_round - 1);
    const endHeight = this.appSetting.getRoundStartHeight(cur_round) - 1;
    const transactions = await this._getUserTransactions(
      address,
      offset,
      limit,
      in_or_out,
      type,
      {
        startHeight,
      }
    );

    return transactions.filter(tran => tran.height <= endHeight);
  }
  myInTransactionsPreRound!: AsyncBehaviorSubject<TYPE.TransactionModel[]>;
  @HEIGHT_AB_Generator("myInTransactionsPreRound", true)
  myInTransactionsPreRound_Executor(promise_pro) {
    return promise_pro.follow(
      this._getUserTransactionsPreRound(
        this.user.address,
        0,
        this.default_user_in_transactions_pageSize,
        "in",
        this.TransactionTypes.SEND
      )
    );
  }
  myOutTransactionsPreRound!: AsyncBehaviorSubject<TYPE.TransactionModel[]>;
  @HEIGHT_AB_Generator("myOutTransactionsPreRound", true)
  myOutTransactionsPreRound_Executor(promise_pro) {
    return promise_pro.follow(
      Promise.all([
        // 接收的转账
        this._getUserTransactionsPreRound(
          this.user.address,
          0,
          this.default_user_out_transactions_pageSize,
          "out",
          this.TransactionTypes.SEND
        ),
        // 投票
        this._getUserTransactionsPreRound(
          this.user.address,
          0,
          this.default_user_out_transactions_pageSize,
          "in",
          this.TransactionTypes.VOTE
        ),
      ]).then(([get_trans, vote_trans]) => {
        return get_trans.concat(vote_trans);
      })
    );
  }

  /**
   * 使用Mongodb语句查询交易
   */
  async queryTransaction(
    query,
    order,
    offset?: number,
    limit?: number,
    select?
  ) {
    return this.fetch.get<TYPE.QueryTransactionsResModel>(
      this.QUERY_TRANSACTIONS,
      {
        search: {
          query: JSON.stringify(query),
          order: JSON.stringify(order),
          select: select && JSON.stringify(select),
          limit,
          offset,
        },
      }
    );
  }

  /**
   * 使用Mongodb语句查询交易，通过page,pageSize风格的进行查询
   */
  queryTransactionsByPages(query, order, page = 1, pageSize = 10) {
    return this.queryTransaction(
      query,
      order,
      (page - 1) * pageSize,
      pageSize
    ).then(data => data.transactions);
  }

  /**
   * 获取未确认交易
   */
  async getUnconfirmed(page = 1, limit = 10) {
    const query = {
      address: this.user.address,
      senderPublicKey: this.user.publicKey,
      offset: (page - 1) * limit,
      limit: limit,
    };

    const data = await this.fetch.get<TYPE.QueryTransactionsResModel>(
      this.UNCONFIRMED,
      { search: query }
    );
    return data.transactions;
  }

  getLocalUnconfirmed(
    offset = 0,
    pageSize = 10,
    sort?,
    senderId = this.user.address
  ) {
    return this.unTxDb.find(
      {
        senderId,
      },
      {
        skip: offset,
        limit: pageSize,
        sort,
      }
    );
  }
  /**
   * 获取本地的未确认交易，并确保已经被处理
   */
  async getLocalUnconfirmedAndCheck(
    offset = 0,
    pageSize = 10,
    sort?,
    senderId = this.user.address
  ) {
    const res_checkd_tra_list: TYPE.TransactionModel[] = [];

    const ids = new Set<string>();
    const rm_untra_ids = new Set();
    do {
      const tra_list = await this.getLocalUnconfirmed(
        offset,
        pageSize,
        sort,
        senderId
      );
      if (!this.fetch.onLine) {
        // 断网的情况下直接返回
        return tra_list;
      }
      // 向服务端查询交易是否完成，批量查询
      await this.queryTransaction(
        {
          id: { $in: tra_list.map(t => t.id) },
        },
        {},
        0,
        tra_list.length,
        { id: 1 }
      ).then(data => data.transactions.forEach(t => ids.add(t.id)));

      // 将查询的结果用于过滤本地交易，并且标记那些已经被处理的交易，要从本地中移除
      for (var tra of tra_list) {
        if (ids.has(tra.id)) {
          rm_untra_ids.add(tra["_id"]);
        } else {
          res_checkd_tra_list.push(tra);
        }
        if (res_checkd_tra_list.length >= pageSize) {
          break;
        }
      }

      if (tra_list.length < pageSize) {
        break;
      }
    } while (res_checkd_tra_list.length < pageSize);
    // 将标记为已经完成的本地数据移除
    for (var _rm_id of rm_untra_ids) {
      await this.unTxDb.remove({ _id: _rm_id });
    }
    return res_checkd_tra_list;
  }

  createTxData(
    recipientId: string,
    amount: any,
    fee = parseFloat(this.appSetting.settings.default_fee),
    password: string,
    secondSecret?: string,
    assetType?: string,
    publicKey = this.user.publicKey
  ) {
    amount = parseFloat(amount);
    // if (amount <= 0 || amount >= parseFloat(this.user.balance)) {
    //   throw this.fetch.ServerResError.getI18nError("Amount error");
    // }
    // if (amount + fee > parseFloat(this.user.balance)) {
    //   throw this.fetch.ServerResError.getI18nError("Amount error");
    // }

    const txData: any = {
      type: this.TransactionTypes.SEND,
      secret: password,
      amount: amount.toString(),
      recipientId: recipientId,
      publicKey,
      fee: fee.toString(),
    };
    // 数字资产交易
    if (assetType) {
      txData.assetType = assetType;
      txData.type = this.TransactionTypes.TRANSFER_ASSET;
    }
    if (secondSecret) {
      txData.secondSecret = secondSecret;
    }
    return txData;
  }

  /**
   * 转账交易
   * @param recipientId 接收人
   * TODO:全部判断地址是否正确
   */
  async transfer(
    recipientId,
    amount,
    fee = parseFloat(this.appSetting.settings.default_fee),
    password,
    secondSecret,
    assetType?
  ) {
    const txData = this.createTxData(
      recipientId,
      amount,
      fee,
      password,
      secondSecret,
      assetType
    );

    const responseData = await this.putTransaction(txData);
    return {
      transfer: {
        senderId: this.user.address,
        senderUsername: this.user.username,
        dateCreated: Date.now(),
        id: responseData.transactionId,
        ...txData,
        fee: fee * 1e8,
        amount: amount * 1e8,
        assetType,
      } as TYPE.TransactionModel,
      responseData,
    };
  }

  /**
   * 验证主密码
   * @param passphrase
   */
  async verifyPassphrase(passphrase) {
    let keypair = this.keypairService.create(passphrase);
    if (this.user.publicKey === keypair.publicKey.toString("hex")) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * 判断地址是否正确
   * @param address
   */
  isAddressCorrect(address): boolean {
    return this.addresssCheck.isAddress(address);
  }
}
