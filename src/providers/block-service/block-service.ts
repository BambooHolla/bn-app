import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AppFetchProvider, CommonResponseData } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject } from "rxjs";
import {
  FLP_Tool,
  tryRegisterGlobal,
} from "../../../src/bnqkl-framework/FLP_Tool";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { AsyncBehaviorSubject } from "../../bnqkl-framework/RxExtends";
import { PromisePro } from "../../bnqkl-framework/PromiseExtends";

import {
  AppSettingProvider,
  TB_AB_Generator,
  HEIGHT_AB_Generator,
} from "../app-setting/app-setting";
import { TransactionServiceProvider } from "../transaction-service/transaction-service";
import { UserInfoProvider } from "../user-info/user-info";
import * as IFM from "ifmchain-ibt";
import * as TYPE from "./block.types";
import { TransactionModel } from "../transaction-service/transaction.types";
import { DelegateModel, DelegateInfoResModel } from "../min-service/min.types";
import { MinServiceProvider } from "../min-service/min-service";
import {
  DbCacheProvider,
  HTTP_Method,
  RequestOptionsWithResult,
} from "../db-cache/db-cache";
import { Mdb } from "../mdb";
import io from "socket.io-client";
tryRegisterGlobal("socketio", io);

export * from "./block.types";

@Injectable()
export class BlockServiceProvider extends FLP_Tool {
  ifmJs: any;
  block: any;
  private _io?: SocketIOClient.Socket;
  get io() {
    return (
      this._io ||
      (this._io = io(AppSettingProvider.SERVER_URL, {
        transports: ["websocket"],
      }))
    );
  }

  blockDb: Mdb<TYPE.BlockModel>;

  constructor(
    public http: HttpClient,
    public appSetting: AppSettingProvider,
    public fetch: AppFetchProvider,
    public storage: Storage,
    public translateService: TranslateService,
    public transactionService: TransactionServiceProvider,
    public user: UserInfoProvider,
    public minService: MinServiceProvider,
    public dbCache: DbCacheProvider,
  ) {
    super();
    tryRegisterGlobal("blockService", this);
    this.ifmJs = AppSettingProvider.IFMJS;
    this.block = this.ifmJs.Api(AppSettingProvider.HTTP_PROVIDER).block;

    // // 启动轮询更新更新
    // this._loopGetAndSetHeight();

    // 启动websocket的监听更新
    this._listenGetAndSetHeight();
    
    // 安装api服务
    this.blockDb = dbCache.installDatabase("blocks", []);
    dbCache.installApiCache<TYPE.BlockModel, TYPE.BlockListResModel>(
      "blocks",
      "get",
      this.GET_BLOCK_BY_QUERY,
      async (db, request_opts) => {
        const search = request_opts.reqOptions.search as any;
        if (!search) {
          throw new Error("Parameter verification failed.");
        }
        let {
          limit,
          orderBy,
          offset,
          startHeight,
          endHeight,
          ...query
        } = search;
        if (Number.isFinite(startHeight) && Number.isFinite(endHeight)) {
          query.height = {
            $gte: startHeight,
            $lte: endHeight,
          };
          if (!limit) {
            limit = Math.abs(endHeight - startHeight) + 1;
          }
        }
        {
          const sort_params = orderBy.split(":");
          var sort = { [sort_params[0]]: sort_params[1] == "desc" ? -1 : 1 };
        }
        const blocks = await db.find(query, {
          sort,
          limit,
          skip: offset,
        });
        const cache = { blocks, success: true } as TYPE.BlockListResModel;
        if (Number.isFinite(query.height) && blocks.length === 1) {
          return { reqs: [], cache };
        }
        if (Number.isFinite(limit) && blocks.length == limit) {
          return { reqs: [], cache };
        }
        return { reqs: [request_opts], cache };
      },
      async req_res_list => {
        if (req_res_list.length > 0) {
          return req_res_list[0].result;
        }
      },
      async (db, mix_res, cache) => {
        if (mix_res && mix_res.success) {
          const res_blocks = mix_res.blocks;
          if (res_blocks instanceof Array) {
            const old_blocks =
              cache.blocks instanceof Array
                ? cache.blocks
                : await db.find({
                    height: { $in: res_blocks.map(b => b.height) },
                  });
            const unique_height_set = new Set<number>(
              old_blocks.map(b => b.height),
            );
            const new_blocks = res_blocks.filter(block => {
              return !unique_height_set.has(block.height);
            });
            await db.insertMany(new_blocks);
          }
          return mix_res;
        }
        return cache;
      },
    );
    dbCache.installApiCache<TYPE.BlockModel, TYPE.BlockResModel>(
      "blocks",
      "get",
      this.GET_BLOCK_BY_ID,
      async (db, request_opts) => {
        const query = request_opts.reqOptions.search;
        const cache_block = await db.findOne(query);
        const cache = {
          block: cache_block,
          success: true,
        } as TYPE.BlockResModel;
        if (cache_block) {
          return { reqs: [], cache };
        }
        return { reqs: [request_opts], cache };
      },
      async req_res_list => {
        if (req_res_list.length > 0) {
          return req_res_list[0].result;
        }
      },
      async (db, mix_res, cache) => {
        if (mix_res) {
          const new_block = mix_res.block;
          if (await db.has({ id: new_block.id })) {
          }
          await db.insert(new_block);
          cache.block = new_block;
        }
        return cache;
      },
    );
  }
  /// TODO: 弃用
  readonly GET_LAST_BLOCK_URL = this.appSetting.APP_URL(
    "/api/blocks/getLastBlock",
  );
  readonly GET_BLOCK_BY_QUERY = this.appSetting.APP_URL("/api/blocks");
  readonly GET_BLOCK_BY_ID = this.appSetting.APP_URL("/api/blocks/get");
  readonly GET_POOL = this.appSetting.APP_URL("/api/system/pool");
  readonly GET_FORGING_BLOCK = this.appSetting.APP_URL(
    "/api/blocks/getForgingBlocks",
  );
  /**第二个块的timestamp*/
  // private _timestamp_from?: number;
  async getLastBlockRefreshInterval() {
    // if (this._timestamp_from == undefined) {
    //   const second_block = await this.secondBlock.getPromise();
    //   this._timestamp_from = second_block.timestamp;
    // }
    const last_block = await this.lastBlock.getPromise();
    this.appSetting.setHeight(last_block.height);

    const lastTime = this.getFullTimestamp(last_block.timestamp);
    const currentTime = Date.now();
    const diff_time = currentTime - lastTime;
    return diff_time;
  }

  secondBlock!: AsyncBehaviorSubject<TYPE.BlockModel>;
  @HEIGHT_AB_Generator("secondBlock")
  secondBlock_Executor(promise_pro) {
    // 初始化缓存100条，后面每个块更新增量缓存1条，最大缓存1000条数据
    return promise_pro.follow(
      this.fetch
        .get<TYPE.BlockListResModel>(this.GET_BLOCK_BY_QUERY, {
          search: {
            height: 2,
          },
        })
        .then(res => res.blocks[0]),
    );
  }

  private _refresh_interval = 0;
  private _retry_interval = 0;
  private async _loopGetAndSetHeight(emit_retry?: boolean) {
    const do_loop = async () => {
      const old_data = await this.lastBlock.getPromise();
      this.lastBlock.refresh();
      const new_data = await this.lastBlock.getPromise();
      // 这里不需要捕捉错误，_loop内有完整的错误捕捉方案。所以只需要执行就可以了
      this._loopGetAndSetHeight(new_data == old_data);
    };
    const BLOCK_UNIT_TIME = this.appSetting.BLOCK_UNIT_TIME;
    try {
      if (emit_retry) {
        // 刷新时间递增
        if (this._refresh_interval === 0) {
          this._refresh_interval = 1e3;
        } else {
          this._refresh_interval *= 2;
        }
        // 至少二分之一轮要更新一次
        this._refresh_interval = Math.min(
          BLOCK_UNIT_TIME / 2,
          this._refresh_interval,
        );
        setTimeout(do_loop, this._refresh_interval);
      } else {
        let diff_time = await this.getLastBlockRefreshInterval();
        // if (diff_time <= 0) {
        //   throw new RangeError("Wrong diff time");
        // }
        diff_time %= BLOCK_UNIT_TIME;
        if (diff_time < BLOCK_UNIT_TIME) {
          this._refresh_interval = 0;
          console.log(
            `%c高度将在${new Date(
              Date.now() + BLOCK_UNIT_TIME - diff_time,
            ).toLocaleTimeString()}进行更新`,
            "background-color:#3ef;color:#FFF",
          );
          setTimeout(do_loop, BLOCK_UNIT_TIME - diff_time);
        }
      }
      this._retry_interval = 0; // 无异常，重置异常计时器
    } catch (err) {
      console.warn(err);
      if (this._retry_interval === 0) {
        this._retry_interval = 1e3;
      } else {
        this._retry_interval *= 2;
      }
      this._retry_interval = Math.min(
        BLOCK_UNIT_TIME / 2,
        this._retry_interval,
      );
      setTimeout(do_loop, this._retry_interval);
    }
  }
  round_end_time = new Date();
  @asyncCtrlGenerator.retry()
  private async _updateHeight(last_block?: TYPE.SingleBlockModel) {
    this.lastBlock.refresh("update Height");
    if (!last_block) {
      last_block = await this.lastBlock.getPromise();
    }
    this.round_end_time = new Date(
      Date.now() +
        this.appSetting.getBlockNumberToRoundEnd(last_block.height) *
          this.appSetting.BLOCK_UNIT_TIME,
    );
    this.appSetting.setHeight(last_block.height);
  }
  private async _listenGetAndSetHeight() {
    this.io.on("blocks/change", data => {
      console.log(
        "%c区块更新",
        "color:green;background-color:#eee;font-size:1.2rem",
      );
      if (data.lastBlock) {
        this.blockDb.insert(data.lastBlock);
      }
      this._updateHeight(data.lastBlock);
    });
    this.io.on("connect", () => {
      this._updateHeight();
    });
  }

  /**
   * 获取当前区块链的块高度
   * @returns {Promise<any>}
   */
  async getLastBlock(): Promise<TYPE.SingleBlockModel> {
    // return blocks_res.blocks[0];
    let data = await this.fetch.get<any>(this.GET_LAST_BLOCK_URL);
    return data.block;
  }

  lastBlock = new AsyncBehaviorSubject<TYPE.SingleBlockModel>(promise_pro => {
    return promise_pro.follow(this.getLastBlock());
  });

  tstamp = Date.UTC(
    AppSettingProvider.SEED_DATE[0],
    AppSettingProvider.SEED_DATE[1],
    AppSettingProvider.SEED_DATE[2],
    AppSettingProvider.SEED_DATE[3],
    AppSettingProvider.SEED_DATE[4],
    AppSettingProvider.SEED_DATE[5],
    AppSettingProvider.SEED_DATE[6],
  ) / 1000;
  /**
   * 获取输入的时间戳的完整时间戳,TODO: 和minSer重复了
   * @param timestamp
   */
  getFullTimestamp(timestamp: number) {
    // let seed = new Date(
    //   Date.UTC(
    //     AppSettingProvider.SEED_DATE[0],
    //     AppSettingProvider.SEED_DATE[1],
    //     AppSettingProvider.SEED_DATE[2],
    //     AppSettingProvider.SEED_DATE[3],
    //     AppSettingProvider.SEED_DATE[4],
    //     AppSettingProvider.SEED_DATE[5],
    //     AppSettingProvider.SEED_DATE[6],
    //   ),
    // );
    // let tstamp = parseInt((seed.getTime() / 1000).toString());
    const { tstamp } = this;
    const fullTimestamp = (timestamp + tstamp) * 1000;
    return fullTimestamp;
  }

  /**
   * 根据块ID获取块信息，返回一个对象
   * @param {string} blockId
   * @returns {Promise<any>}
   */
  async getBlockById(blockId: string): Promise<TYPE.SingleBlockModel> {
    const data = await this.fetch.get<any>(this.GET_BLOCK_BY_ID, {
      search: {
        id: blockId,
      },
    });

    return data.blocks;
  }

  /**
   * 返回根据高度搜索到的块，返回一个对象
   * @param {number} height
   * @returns {Promise<any>}
   */
  async getBlockByHeight(height: number): Promise<TYPE.BlockModel[]> {
    let data = await this.fetch.get<any>(this.GET_BLOCK_BY_QUERY, {
      search: {
        height: height,
      },
    });

    return data.blocks;
  }

  /**
   * 返回根据地址搜索的块，返回一个数组
   * @param {string} address
   * @returns {Promise<any>}
   */
  async getBlocksByAddress(address: string): Promise<TYPE.BlockModel[]> {
    let data = await this.fetch.get<any>(this.GET_BLOCK_BY_QUERY, {
      search: {
        generatorId: address,
      },
    });

    return data.blocks;
  }

  /**
   * 搜索块，可以搜索高度、地址和ID任一
   * @param {string} query
   * @returns {Promise<any>}
   */
  async searchBlocks(
    query: string,
  ): Promise<TYPE.BlockModel[] | TYPE.SingleBlockModel[]> {
    //如果是纯数字且不是以0开头就查高度
    if (/[1-9][0-9]*/.test(query)) {
      const query_num = parseFloat(query) * 1;
      let data = await this.getBlockByHeight(query_num);
      // if (data.length > 0) {
      return data;
      // }
    } else {
      //首先查创块人
      let data1 = await this.getBlocksByAddress(query);
      if (data1.length > 0) {
        return data1;
      }

      //不是创块人则搜索ID
      let data2 = await this.getBlockById(query);
      if (data2.id) {
        return [data2];
      }

      return [];
    }
  }

  /**
   * 获取区块信息
   * @param {{}} query  查询的条件，对象存在
   * @returns {Promise<{}>}
   */
  async getBlocks(query): Promise<TYPE.BlockListResModel> {
    let data = await this.fetch.get<TYPE.BlockListResModel>(
      this.GET_BLOCK_BY_QUERY,
      {
        search: query,
      },
    );

    return data;
  }

  /**
   * 判断当前的块是否延迟，返回块数组
   * @param list
   */
  blockListHandle(
    list: TYPE.BlockModel[],
    per_item?: TYPE.BlockModel,
    end_item?: TYPE.BlockModel,
  ): TYPE.BlockModel[] {
    const { BLOCK_UNIT_TIME } = this.appSetting;
    const BLOCK_UNIT_SECONED = BLOCK_UNIT_TIME / 1000;
    let i = -1;
    if (!per_item) {
      i += 1;
      per_item = list[i];
    }
    while (true) {
      i += 1;
      const cur_item = list[i] || end_item;
      if (!cur_item) {
        break;
      }
      if (per_item.timestamp > cur_item.timestamp + BLOCK_UNIT_SECONED) {
        per_item.delay = true;
      } else {
        per_item.delay = false;
      }

      if (cur_item === end_item) {
        break;
      }
      per_item = cur_item;
    }
    // for (var i = 0; i < list.length - 1; i++) {
    //   if (list[i].timestamp > list[i + 1].timestamp + BLOCK_UNIT_SECONED) {
    //     list[i].delay = true;
    //   } else {
    //     list[i].delay = false;
    //   }
    // }
    return list;
  }

  /**
   * 分页查询块数据，页数从1开始
   * @param {number} page 从1开始
   * @param {number} limit
   * @returns {Promise<any>}
   */
  async getBlocksByPage(
    page: number,
    pageSize = 10,
    sort: 1 | -1 = 1, // 默认增序
  ): Promise<TYPE.BlockModel[]> {
    const res = await this.getBlocks({
      offset: (page - 1) * pageSize,
      limit: pageSize,
      orderBy: sort === 1 ? "height:asc" : "height:desc",
    });

    return res.blocks;
  }
  async getBlocksByRange(
    startHeight: number,
    endHeight: number,
    sort: 1 | -1 = 1, // 默认增序
  ) {
    const res = await this.getBlocks({
      startHeight,
      endHeight,
      orderBy: sort === 1 ? "height:asc" : "height:desc",
    });

    return res.blocks;
  }
  /**
   * 获取最新的几个区块，（默认顺序是倒序）
   */
  async getTopBlocks(amount = 10) {
    return this.getBlocksByPage(1, amount, -1);
  }

  /**
   * 获取块中的交易，分页
   */
  async getTransactionsInBlock(
    blockId: string,
    page = 1,
    limit = 10,
  ): Promise<TransactionModel[]> {
    let query = {
      blockId: blockId,
      offset: (page - 1) * limit,
      limit: limit,
      orderBy: "t_timestamp:desc",
    };
    let data = await this.transactionService.getTransactions(query);

    return data.transactions;
  }

  /**
   * 获取最近n个块的平均奖励
   * @param amount
   */
  async getAvgInfo(amount: number = 5) {
    const blockArray = await this.getTopBlocks(amount);
    amount = Math.min(blockArray.length, amount);
    let reward = 0,
      fee = 0;
    for (var i = 0; i < amount; i++) {
      reward += parseFloat(blockArray[i].reward);
      fee += parseFloat(blockArray[i].totalFee);
    }

    reward = reward / amount;
    fee = fee / amount;

    return { reward, fee };
  }

  /**
   * 获取当前的未确认交易数
   */
  async getPoolUnconfirmed(): Promise<number> {
    let data = await this.fetch.get<any>(this.GET_POOL);

    return data.Transactions.u;
  }

  /**
   * 获取未来一个块的预期信息
   * @param:amount 根据最近n个块来获取平均值
   * 返回平均收益、平均手续费、未确认交易数
   */
  async getExpectBlockInfo(amount: number = 5) {
    var data: TYPE.UnconfirmBlockModel;
    if (!navigator.onLine) {
      data = {
        reward: 0,
        fee: 0,
        uncommited: 0,
        height: this.appSetting.getHeight() + 1,
      };
    } else {
      amount = amount < 57 ? amount : 57;
      let uncommited = 0; // await this.getPoolUnconfirmed();
      let blockInfo = await this.getAvgInfo(amount);
      data = {
        ...blockInfo,
        uncommited,
        height: this.appSetting.getHeight() + 1,
      };
    }

    return data;
  }
  expectBlockInfo!: AsyncBehaviorSubject<TYPE.UnconfirmBlockModel>;
  @HEIGHT_AB_Generator("expectBlockInfo")
  expectBlockInfo_Executor(promise_pro) {
    return promise_pro.follow(this.getExpectBlockInfo());
  }

  default_my_forging_pagesize = 20;
  async getForgingByPage(
    generatorPublicKey: string,
    page = 1,
    pageSize = this.default_my_forging_pagesize,
  ) {
    const data = await this.fetch.get<TYPE.ForgingBlockResModel>(
      this.GET_FORGING_BLOCK,
      {
        search: {
          generatorPublicKey,
          offset: (page - 1) * pageSize,
          limit: pageSize,
          orderBy: "height:desc",
        },
      },
    );
    return data;
  }
  getMyForgingByPage(page?: number, pageSize?: number) {
    return this.getForgingByPage(this.user.publicKey, page, pageSize);
  }
  /**
   * 获取我锻造的区块数
   */
  myForgingCount!: AsyncBehaviorSubject<number>;
  @HEIGHT_AB_Generator("myForgingCount", true)
  myForgingCount_Executor(promise_pro) {
    return promise_pro.follow(
      this.minService.myDelegateInfo.getPromise().then(delegate => {
        return delegate ? delegate.producedblocks : 0;
      }),
    );
  }
}
