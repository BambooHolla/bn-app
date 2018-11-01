import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AppFetchProvider, CommonResponseData } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { FLP_Tool, tryRegisterGlobal } from "../../../src/bnqkl-framework/FLP_Tool";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { AsyncBehaviorSubject } from "../../bnqkl-framework/RxExtends";
import { PromisePro, PromiseOut, sleep } from "../../bnqkl-framework/PromiseExtends";

import { AppSettingProvider, TB_AB_Generator, HEIGHT_AB_Generator } from "../app-setting/app-setting";
import { TransactionServiceProvider } from "../transaction-service/transaction-service";
import { UserInfoProvider } from "../user-info/user-info";
import * as TYPE from "./block.types";
import { TransactionModel } from "../transaction-service/transaction.types";
import { MinServiceProvider } from "../min-service/min-service";
import { AppUrl, baseConfig, ReadToGenerate, global } from "../../bnqkl-framework/helper";
// import { AOT_Placeholder, AOT } from "../../bnqkl-framework/helper";
import { DownloadBlockChainMaster } from "./download-block-chain.fack-worker";
import { BlockchainDB } from '../../../workers/blockchain-db/index';
import debug from "debug";
const log = debug("IBT:block-service");
import { BlockQuery } from "./block-query";
import { P2PIO } from "./p2p-io";
import { BlockChainSync } from "./blockchain-sync";

type PeerServiceProvider = import("../peer-service/peer-service").PeerServiceProvider;

export * from "./block.types";


@Injectable()
export class BlockServiceProvider extends BlockQuery {
  private constructor_inited = new PromiseOut<BlockServiceProvider>();
  p2p_io = new P2PIO(this.constructor_inited);
  blockchain_sync = new BlockChainSync(this.constructor_inited);

  @baseConfig.WatchPropChanged("MAGIC")
  private get blockchaindbv3_ready() { return new PromisePro<BlockchainDB<TYPE.BlockModel>>(); }
  private _blockchaindbv3?: BlockchainDB<TYPE.BlockModel>;
  getBlockDB() {
    return this.blockchaindbv3_ready.promise;
  }

  /**初始化数据库 */
  is_db_v3_inited = this._initDB_V3();
  @baseConfig.WatchPropChanged("MAGIC")
  private async _initDB_V3() {
    const blockDb = new BlockchainDB<TYPE.BlockModel>(this.baseConfig.MAGIC, {
      PAGE_SIZE: 1e4
    });
    await blockDb.afterInited();
    this.blockchaindbv3_ready.resolve(blockDb);
    this._blockchaindbv3 = blockDb;
  }

  oneTimeUrl(app_url: AppUrl, server_url: string, force_network?: boolean) {
    app_url.disposableServerUrl(server_url);
    this.fetch.forceNetwork(force_network);
    return this;
  }

  constructor(
    public http: HttpClient,
    public appSetting: AppSettingProvider,
    public fetch: AppFetchProvider,
    public storage: Storage,
    public translateService: TranslateService,
    public transactionService: TransactionServiceProvider,
    public user: UserInfoProvider,
    public minService: MinServiceProvider,
  ) {
    super(appSetting, fetch);

    this.constructor_inited.resolve(this);

    // 未连接上websocket前，先使用本地缓存来更新一下高度
    this.getLocalLastBlock().then(local_newest_block => {
      if (local_newest_block && this._last_update_height_block === undefined) {
        this.updateHeight(local_newest_block);
      }
    });
    // 启动websocket的监听更新
    this._listenGetAndSetHeight();

    /// 重新初始化一些同步区块链的状态
    this.appSetting.share_settings.is_syncing_blocks = false;
    this.appSetting.share_settings.sync_is_verifying_block = false;
  }

  @FLP_Tool.FromGlobal peerService!: PeerServiceProvider;

  /// TODO: 弃用
  readonly GET_POOL = this.appSetting.APP_URL("/api/system/pool");
  readonly GET_FORGING_BLOCK = this.appSetting.APP_URL("/api/blocks/getForgingBlocks");
  /**第二个块的timestamp*/
  // private _timestamp_from?: number;
  async getLastBlockRefreshInterval() {
    const last_block = await this.lastBlock.getPromise();

    const lastTime = this.getFullTimestamp(last_block.timestamp);
    const currentTime = Date.now();
    const diff_time = currentTime - lastTime;
    return diff_time;
  }

  round_end_time = new Date();
  /**最后一次应用于updateHeight的last_block参数 */
  private _last_update_height_block?: TYPE.BlockModel
  /**更新区块链的最新一个区块 */
  // @asyncCtrlGenerator.queue({ can_mix_queue: 1 })
  async updateHeight(last_block?: TYPE.BlockModel) {
    this.lastBlock.refresh("update Height");
    if (!last_block) {
      last_block = await this.getLastBlock();
    }
    const cur_height = this.appSetting.getHeight();
    if (cur_height === last_block.height) {
      return;
    }
    this._last_update_height_block = last_block;
    //TODO: 如果本地已经有这个区块，而且我本地的最高区块比他还高，那么应该使用我本地的作为正确的区块

    // 更新轮次计时器
    this.round_end_time = new Date(Date.now() + this.appSetting.getBlockNumberToRoundEnd(last_block.height) * this.baseConfig.BLOCK_UNIT_TIME);
    // 如果同步进度是最新区块的话，那么继续跟进这个进度
    if (this.appSetting.share_settings.sync_progress_height === cur_height) {
      this.appSetting.share_settings.sync_progress_height = last_block.height;
    }
    // 更新高度
    this.appSetting.setHeight(last_block.height);
  }
  // private
  private async _listenGetAndSetHeight() {
    this.fetch.on("ononline", () => {
      // 联网的时候，更新一下区块
      this.updateHeight();
    });
    this.fetch.on("onoffline", () => {
      this.updateHeight();
    });
  }


  empty_block: TYPE.BlockModel = {
    height: 0,
    id: "",
    timestamp: 0,
    magic: "",
    version: 0,
    previousBlock: "",
    numberOfTransactions: 0,
    totalAmount: "0",
    totalFee: "0",
    reward: "0",
    payloadLength: 0,
    payloadHash: "",
    generatorPublicKey: "",
    generatorId: "",
    blockSignature: "",
    blockSize: "0",
    remark: "",
  };

  /**最后最新的区块，由updateHeight管理更新 */
  lastBlock = new AsyncBehaviorSubject<TYPE.SingleBlockModel>(promise_pro => {
    return promise_pro.follow(this.getLastBlock());
  });

  /**
   * 获取输入的时间戳的完整时间戳,TODO: 和minSer重复了
   * @param timestamp
   */
  getFullTimestamp(timestamp: number) {
    const fullTimestamp = (timestamp + this.baseConfig.seedDateTimestamp) * 1000;
    return fullTimestamp;
  }


  /**
   * 判断当前的块是否延迟，返回块数组
   * @param list
   */
  blockListHandle(list: TYPE.BlockModel[], per_item?: TYPE.BlockModel, end_item?: TYPE.BlockModel): TYPE.BlockModel[] {
    const { BLOCK_UNIT_TIME } = this.baseConfig;
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
   * 获取块中的交易，分页
   */
  async getTransactionsInBlock(blockId: string, page = 1, pageSize = 10): Promise<TransactionModel[]> {
    const data = await this.transactionService.queryTransaction({ blockId }, { timestamp: -1 }, (page - 1) * pageSize, pageSize);

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

  /**预期确认数量 */
  private _expectblock_uncommited = 0;
  public get expectblock_uncommited() {
    return this._expectblock_uncommited;
  }
  public set expectblock_uncommited(value) {
    this._expectblock_uncommited = value;
  }
  /**预期手续费 */
  private _expectblock_fee_reward = 0;
  public get expectblock_fee_reward() {
    return this._expectblock_fee_reward;
  }
  public set expectblock_fee_reward(value) {
    this._expectblock_fee_reward = value;
  }
  /**
   * 获取未来一个块的预期信息
   * @param:amount 根据最近n个块来获取平均值
   * 返回平均收益、平均手续费、未确认交易数
   */
  async getExpectBlockInfo(amount: number = 5) {
    return {
      reward: 3500000000 + this.expectblock_fee_reward,
      fee: this.expectblock_fee_reward,
      uncommited: this.expectblock_uncommited,
      height: (await this.lastBlock.getPromise()).height + 1,
    };
  }
  expectBlockInfo!: AsyncBehaviorSubject<TYPE.UnconfirmBlockModel>;
  @HEIGHT_AB_Generator("expectBlockInfo")
  expectBlockInfo_Executor(promise_pro) {
    return promise_pro.follow(this.getExpectBlockInfo());
  }

  default_my_forging_pagesize = 20;
  async getForgingByPage(generatorPublicKey: string, page = 1, pageSize = this.default_my_forging_pagesize) {
    const data = await this.fetch.get<TYPE.ForgingBlockResModel>(this.GET_FORGING_BLOCK, {
      search: {
        generatorPublicKey,
        offset: (page - 1) * pageSize,
        limit: pageSize,
        orderBy: "height:desc",
      },
    });
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
        return (delegate && delegate.producedblocks) || 0;
      })
    );
  }
}
