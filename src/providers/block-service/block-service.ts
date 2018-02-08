import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AppFetchProvider, CommonResponseData } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject } from "rxjs";
// import { PromisePro } from "../../bnqkl-framework/RxExtends";
import { AsyncBehaviorSubject } from "../../bnqkl-framework/RxExtends";
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

export * from "./block.types";

@Injectable()
export class BlockServiceProvider {
  ifmJs: any;
  block: any;
  blockArray?: TYPE.BlockModel[] = [];

  constructor(
    public http: HttpClient,
    public appSetting: AppSettingProvider,
    public fetch: AppFetchProvider,
    public storage: Storage,
    public translateService: TranslateService,
    public transactionService: TransactionServiceProvider,
    public user: UserInfoProvider,
  ) {
    this.ifmJs = AppSettingProvider.IFMJS;
    this.block = this.ifmJs.Api(AppSettingProvider.HTTP_PROVIDER).block;

    // 启动轮询更新更新
    this._loopGetAndSetHeight();
  }

  async getLastBlockRefreshInterval() {
    const last_block = await this.lastBlock.getPromise();
    this.appSetting.setHeight(last_block.height);

    let lastTime = this.getFullTimestamp(last_block.timestamp);
    let currentTime = Date.now();
    const diff_time = currentTime - lastTime;
    return diff_time;
  }

  private _refresh_interval = 0;
  private _retry_interval = 0;
  private async _loopGetAndSetHeight() {
    const do_loop = () => {
      this.lastBlock.refresh();
      // 这里不需要捕捉错误，_loop内有完整的错误捕捉方案。所以只需要执行就可以了
      this._loopGetAndSetHeight();
    };
    const BLOCK_UNIT_TIME = this.appSetting.BLOCK_UNIT_TIME;
    try {
      const diff_time = await this.getLastBlockRefreshInterval();
      // if (diff_time <= 0) {
      //   throw new RangeError("Wrong diff time");
      // }
      if (diff_time < BLOCK_UNIT_TIME) {
        this._refresh_interval = 0;
        console.log(
          `%c高度将在${new Date(
            Date.now() + BLOCK_UNIT_TIME - diff_time,
          ).toLocaleTimeString()}进行更新`,
          "background-color:#3ef;color:#FFF",
        );
        setTimeout(do_loop, BLOCK_UNIT_TIME - diff_time);
      } else {
        // 刷新时间递增
        if (this._refresh_interval === 0) {
          this._refresh_interval = 1e3;
        } else {
          this._refresh_interval *= 2;
        }
        // 至少二分之一轮要更新一次
        this._refresh_interval = Math.min(BLOCK_UNIT_TIME / 2, this._refresh_interval);
        setTimeout(do_loop, this._refresh_interval);
      }
      this._retry_interval = 0; // 无异常，重置异常计时器
    } catch (err) {
      console.warn(err);
      if (this._retry_interval === 0) {
        this._retry_interval = 1e3;
      } else {
        this._retry_interval *= 2;
      }
      this._retry_interval = Math.min(BLOCK_UNIT_TIME / 2, this._retry_interval);
      setTimeout(do_loop, this._retry_interval);
    }
  }
  readonly GET_LAST_BLOCK_URL = this.appSetting.APP_URL(
    "/api/blocks/getLastBlock",
  );
  readonly GET_BLOCK_BY_QUERY = this.appSetting.APP_URL("/api/blocks/");
  readonly GET_BLOCK_BY_ID = this.appSetting.APP_URL("/api/blocks/get");
  readonly GET_POOL = this.appSetting.APP_URL("/api/system/pool");
  readonly GET_MY_FORGING = this.appSetting.APP_URL(
    "/api/blocks/getForgingBlocks",
  );

  /**
   * 获取当前区块链的块高度
   * @returns {Promise<any>}
   */
  async getLastBlock(): Promise<TYPE.SingleBlockModel> {
    let data = await this.fetch.get<any>(this.GET_LAST_BLOCK_URL);

    return data.block;
  }

  lastBlock = new AsyncBehaviorSubject<TYPE.SingleBlockModel>(promise_pro => {
    return promise_pro.follow(this.getLastBlock());
  });

  /**
   * 获取输入的时间戳的完整时间戳,TODO: 和minSer重复了
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
    let tstamp = parseInt((seed.getTime() / 1000).toString());
    let fullTimestamp = (timestamp + tstamp) * 1000;
    return fullTimestamp;
  }

  /**
   * 根据块ID获取块信息，返回一个对象
   * @param {string} blockId
   * @returns {Promise<any>}
   */
  async getBlockById(blockId: string): Promise<TYPE.SingleBlockModel> {
    let data = await this.fetch.get<any>(this.GET_BLOCK_BY_ID, {
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
  async getBlocks(query): Promise<TYPE.BlockResModel> {
    let data = await this.fetch.get<TYPE.BlockResModel>(
      this.GET_BLOCK_BY_QUERY,
      {
        search: query,
      },
    );

    return data;
  }

  /**
   * 增量更新块信息
   * @param {number} amount  更新数量，空时默认10个
   * @param {boolean} increment  是否增量更新
   * @returns {Promise<void>}
   */
  async getTopBlocks(
    increment: boolean,
    amount = 10,
  ): Promise<TYPE.BlockModel[]> {
    //增量查询
    if (increment) {
      let currentHeight = this.appSetting.getHeight();

      //有缓存时
      if (
        this.blockArray &&
        this.blockArray.length > 0 &&
        this.blockArray.length >= amount
      ) {
        //如果缓存高度和当前高度一致返回缓存
        if (currentHeight === this.blockArray[0].height) {
          return this.blockArray.slice(0, amount - 1);
        } else {
          //如果缓存高度不一致
          let heightBetween = currentHeight - this.blockArray[0].height;
          //缓存高度和当前高度相差太大则重新获取，否则只获取相差的块
          if (heightBetween > amount) {
            return await this.getTopBlocks(false, amount);
          } else {
            //增量的加入缓存
            const data = await this.getBlocks({
              limit: heightBetween,
              orderBy: "height:desc",
            });
            //把数组插入原数组前面
            //Array.prototype.splice然后把指针指向

            // data.blocks.unshift(data.length, 0);
            // Array.prototype.splice.apply(this.blockArray, data);
            // this.blockArray = data;
            // return this.blockArray.slice(0, amount - 1);

            // TODO:这里采用严格的数据类型检测后发现有BUG，暂时没有解决。外部不在采用这个部分的方法，可以直接取消
            return [];
          }
        }
      } else {
        return await this.getTopBlocks(false, amount);
      }
    } else {
      let data = await this.getBlocks({
        limit: amount,
        orderBy: "height:desc",
      });
      this.blockArray = data.blocks;
      return this.blockArray;
    }
  }
  
  /**
   * 按照高度刷新块
   */
  refreshBlock!: AsyncBehaviorSubject<TYPE.BlockModel[]>
  @HEIGHT_AB_Generator("refreshBlock")
  refreshBlock_Executor(promise_pro) {
    this.getTopBlocks(true);
  }

  /**
   * 判断当前的块是否延迟，返回块数组
   * @param list
   */
  blockListHandle(list: TYPE.BlockModel[]): TYPE.BlockModel[] {
    const {BLOCK_UNIT_TIME} = this.appSetting;
    const BLOCK_UNIT_SECONED = BLOCK_UNIT_TIME/1000;
    for (let i = 0; i < list.length - 1; i++) {
      if (list[i].timestamp > list[i + 1].timestamp + BLOCK_UNIT_SECONED) {
        list[i].delay = true;
      } else {
        list[i].delay = false;
      }
    }
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
    limit = 10,
    sort = true,
  ): Promise<TYPE.BlockModel[]> {
    if (page === 1 && this.blockArray && this.blockArray.length > limit) {
      return await this.getTopBlocks(true, limit);
    } else {
      let query = {
        offset: (page - 1) * limit,
        limit: limit,
        orderBy: sort ? "height:asc" : "height:desc",
      };

      let data = await this.getBlocks(query);
      // for(let i in data) {
      //   if(sort) {
      //     data[i+1].lastBlockId = data[i].id;
      //   }else {
      //     data[i].lastBlockId = data[i+1].id;
      //   }
      // }

      return data.blocks;
    }
  }

  /**
   * 获取上一个块的ID
   * TODO：实现区块链数据库，使用数据库索引查询
   * @param height
   */
  async getPreBlockId(height: number): Promise<string> {
    if (height > 1) {
      const pre_height = height - 1;
      if (this.blockArray) {
        const lists = this.blockArray.slice();
        for (let i = 0; i < lists.length; i += 1) {
          if (i % 1000 === 0) {
            await Promise.resolve(); // 快速异步
          }
          const block = lists[i];
          if (block.height === pre_height) {
            return block.id;
          }
        }
      }
      let data = await this.fetch.get<TYPE.BlockResModel>(
        this.GET_BLOCK_BY_QUERY,
        {
          search: {
            height: pre_height,
          },
        },
      );
      return data.blocks[0].id;
    } else {
      return "";
    }
  }

  /**
   * 获取块中的交易，分页
   * @param blockId
   * @param page
   * @param limit
   * TODO:前端判断如果没有交易量则不要调用该接口
   */
  async getTransactionsInBlock(
    blockId,
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
    var blockArray = this.blockArray;
    if (!blockArray || blockArray.length < amount) {
      blockArray = await this.getTopBlocks(true, amount);
    }
    let reward = 0,
      fee = 0;
    for (let i = 0; i < amount; i++) {
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
    amount = amount < 57 ? amount : 57;
    let uncommited = await this.getPoolUnconfirmed();
    let blockInfo = await this.getAvgInfo(amount);
    let data: TYPE.UnconfirmBlockModel = {
      ...blockInfo,
      uncommited,
      height: this.appSetting.getHeight() + 1,
    };

    return data;
  }
  expectBlockInfo!:AsyncBehaviorSubject<TYPE.UnconfirmBlockModel>
  @HEIGHT_AB_Generator("expectBlockInfo")
  expectBlockInfo_Executor(promise_pro){
    return promise_pro.follow(this.getExpectBlockInfo());
  }

  /**
   * 获取我锻造的区块数
   */
  async getMyForgingCount(): Promise<number> {
    let data = await this.fetch.get<TYPE.BlockResModel>(this.GET_MY_FORGING, {
      search: {
        generatorPublicKey: this.user.publicKey,
      },
    });

    return data.count;
  }
  myForgingCount!:AsyncBehaviorSubject<number>
  @HEIGHT_AB_Generator("myForgingCount")
  myForgingCount_Executor(promise_pro){
    return promise_pro.follow(this.getMyForgingCount())
  }
}
