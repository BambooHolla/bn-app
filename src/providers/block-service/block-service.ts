import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AppFetchProvider, CommonResponseData } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject } from "rxjs";
import { FLP_Tool, tryRegisterGlobal } from "../../../src/bnqkl-framework/FLP_Tool";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { AsyncBehaviorSubject } from "../../bnqkl-framework/RxExtends";
import { PromisePro, PromiseOut, sleep } from "../../bnqkl-framework/PromiseExtends";

import { AppSettingProvider, TB_AB_Generator, HEIGHT_AB_Generator } from "../app-setting/app-setting";
import { TransactionServiceProvider } from "../transaction-service/transaction-service";
import { UserInfoProvider } from "../user-info/user-info";
import * as TYPE from "./block.types";
import { TransactionModel } from "../transaction-service/transaction.types";
import { DelegateModel, DelegateInfoResModel } from "../min-service/min.types";
import { MinServiceProvider } from "../min-service/min-service";
import { AppUrl, baseConfig } from "../../bnqkl-framework/helper";
import { getJsonObjectByteSize, getUTF8ByteSize } from "../../pages/_settings/settings-cache-manage/calcHelper";
import { DbCacheProvider, HTTP_Method, RequestOptionsWithResult } from "../db-cache/db-cache";
import { Mdb } from "../mdb";
import io from "socket.io-client";
import { FangoDB, registerWorkerHandle } from "../../fangodb";
import { BlockDBFactory } from "./helper";
import { DBNumberIndex } from "../../fangodb/src/db-index-core";
import { AOT_Placeholder, AOT } from "../../bnqkl-framework/helper";
import { DownloadBlockChainMaster } from "./download-block-chain.fack-worker";

type PeerServiceProvider = import("../peer-service/peer-service").PeerServiceProvider;
tryRegisterGlobal("socketio", io);

export * from "./block.types";

@Injectable()
export class BlockServiceProvider extends FLP_Tool {
  private _io?: SocketIOClient.Socket;
  get io() {
    return (
      this._io ||
      (this._io = io(AppSettingProvider.SERVER_URL, {
        transports: ["websocket"],
      }))
    );
  }

  private _blockDb_inited = new PromisePro<void>();
  blockDb!: FangoDB<TYPE.BlockModel>;
  magic = new PromiseOut<string>();
  get isBlockDBInited() {
    return this._blockDb_inited.promise;
  }

  /// 关于本地数据库的一些辅助函数
  @AOT_Placeholder.Wait("isBlockDBInited")
  private _getHeightIndex(db: FangoDB<TYPE.BlockModel>) {
    return db.indexs.height.index as DBNumberIndex<string>;
  }
  @AOT_Placeholder.Wait("isBlockDBInited")
  getLocalLastBlockHeight(blockDB = this.blockDb) {
    return Promise.resolve(this._getHeightIndex(blockDB).maxInterge);
  }
  @AOT_Placeholder.Wait("isBlockDBInited")
  async getLocalLastBlock(blockDB = this.blockDb) {
    const height_index = this._getHeightIndex(blockDB);
    const last_block_height = height_index.maxInterge;
    const uid = await height_index.getIndex(last_block_height);
    if (uid) {
      return (await blockDB.getById(uid)) || this.empty_block;
    }
    return this.empty_block;
  }
  @AOT_Placeholder.Wait("isBlockDBInited")
  checkBlockIdInBlockDB(block_id: string, blockDB = this.blockDb) {
    return blockDB.hasId(block_id);
  }
  is_inited: Promise<any>;
  private _init_block_aot = new AOT("init_block");
  private async _initService() {
    this.blockDb = await BlockDBFactory(await this.magic.promise);
    this._blockDb_inited.resolve(this.blockDb.afterInited());
    await this._blockDb_inited.promise;
    this._init_block_aot.compile(true);
  }

  _blockDb: Mdb<TYPE.BlockModel>;

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
    public dbCache: DbCacheProvider
  ) {
    super();

    this._init_block_aot.autoRegister(this);

    tryRegisterGlobal("blockService", this);

    // 安装api服务
    this._blockDb = dbCache.installDatabase("blocks", []);
    dbCache.installApiCache<TYPE.BlockModel, TYPE.BlockListResModel>(
      "blocks",
      "get",
      this.GET_BLOCK_BY_QUERY,
      async (_, request_opts) => {
        const search = request_opts.reqOptions.search as any;
        if (!search) {
          throw new Error("Parameter verification failed.");
        }
        let { limit, orderBy, offset, startHeight, endHeight, ...query } = search;
        let may_need_mix_reqs = false;
        if (Number.isFinite(startHeight) && Number.isFinite(endHeight)) {
          query.height = {
            $gte: startHeight,
            $lte: endHeight,
          };
          may_need_mix_reqs = true;
          if (!limit) {
            limit = Math.abs(endHeight - startHeight) + 1;
          }
        }
        if (Number.isFinite(query.height)) {
          limit = 1;
        }
        let sort;
        if (typeof orderBy === "string") {
          const sort_params = orderBy.split(":");
          sort = { [sort_params[0]]: sort_params[1] == "desc" ? -1 : 1 };
        }
        await this.isBlockDBInited;
        const blocks = await this.blockDb.find(query, {
          sort,
          limit,
          skip: offset,
        });
        const cache = { blocks, success: true } as TYPE.BlockListResModel;
        if (Number.isFinite(query.height) && blocks.length === 1) {
          return { reqs: [], cache };
        }
        // TODO:blocks.length != limit
        // TODO:要考虑request_opts中的范围大小不得超过100，需要做切割再多次获取
        if (Number.isFinite(limit) && blocks.length == limit) {
          return { reqs: [], cache };
        }
        if (this.fetch.onLine) {
          return { reqs: [request_opts], cache };
        } else {
          return { reqs: [], cache };
        }
      },
      async req_res_list => {
        if (req_res_list.length > 0) {
          return req_res_list[0].result;
        }
      },
      async (_, mix_res, cache) => {
        if (mix_res && mix_res.success) {
          const res_blocks = mix_res.blocks;
          if (res_blocks instanceof Array) {
            await this.isBlockDBInited;
            const old_blocks =
              cache.blocks instanceof Array
                ? cache.blocks
                : await this.blockDb.find({
                    height: { $in: res_blocks.map(b => b.height) },
                  });
            const unique_height_set = new Set<number>(old_blocks.map(b => b.height));
            const new_blocks = res_blocks
              .filter(block => {
                return !unique_height_set.has(block.height);
              })
              .map(b => this.formatBlockData(b));
            await this.blockDb.insertMany(new_blocks,{replace:true});
          }
          return mix_res;
        }
        return cache;
      }
    );
    dbCache.installApiCache<TYPE.BlockModel, TYPE.BlockResModel>(
      "blocks",
      "get",
      this.GET_BLOCK_BY_ID,
      async (_, request_opts) => {
        const query = request_opts.reqOptions.search;
        await this.isBlockDBInited;
        const cache_block = await this.blockDb.findOne(query);
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
      async (_, mix_res, cache) => {
        if (mix_res) {
          const new_block = mix_res.block;
          if (!(await this.checkBlockIdInBlockDB(new_block.id))) {
            await this.blockDb.insert(this.formatBlockData(new_block),{replace:true});
          }
          cache.block = new_block;
        }
        return cache;
      }
    );

    // 未连接上websocket前，先使用本地缓存来更新一下高度
    this.getLocalLastBlock().then(local_newest_block => {
      this._updateHeight(local_newest_block);
    });
    // 启动websocket的监听更新
    this._listenGetAndSetHeight();

    /// 重新初始化一些同步区块链的状态
    this.appSetting.share_settings.is_syncing_blocks = false;
    this.appSetting.share_settings.sync_is_verifying_block = false;

    // 初始化数据库
    this.is_inited = this._initService();
  }

  @FLP_Tool.FromGlobal peerService!: PeerServiceProvider;

  /// TODO: 弃用
  readonly GET_LAST_BLOCK_URL = this.appSetting.APP_URL("/api/blocks/getLastBlock");
  readonly GET_BLOCK_BY_QUERY = this.appSetting.APP_URL("/api/blocks/");
  readonly GET_BLOCK_BY_ID = this.appSetting.APP_URL("/api/blocks/get");
  readonly GET_POOL = this.appSetting.APP_URL("/api/system/pool");
  readonly GET_FORGING_BLOCK = this.appSetting.APP_URL("/api/blocks/getForgingBlocks");
  /**第二个块的timestamp*/
  // private _timestamp_from?: number;
  async getLastBlockRefreshInterval() {
    // if (this._timestamp_from == undefined) {
    //   const second_block = await this.secondBlock.getPromise();
    //   this._timestamp_from = second_block.timestamp;
    // }
    const last_block = await this.lastBlock.getPromise();

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
        .then(res => res.blocks[0])
    );
  }
  formatBlockData(block: TYPE.BlockModel): TYPE.BlockModel {
    return {
      magic: block.magic,
      version: block.version,
      timestamp: block.timestamp,
      totalAmount: block.totalAmount,
      totalFee: block.totalFee,
      reward: block.reward,
      numberOfTransactions: block.numberOfTransactions,
      payloadLength: block.payloadLength,
      payloadHash: block.payloadHash,
      generatorId: block.generatorId,
      generatorPublicKey: block.generatorPublicKey,
      blockSignature: block.blockSignature,
      previousBlock: block.previousBlock,
      id: block.id,
      height: block.height,
      blockSize: block.blockSize,
      remark: block.remark,
    };
  }

  round_end_time = new Date();
  @asyncCtrlGenerator.queue({ can_mix_queue: 1 })
  private async _updateHeight(last_block?: TYPE.BlockModel) {
    this.lastBlock.refresh("update Height");
    if (!last_block) {
      last_block = await this.getBlockByHeight((await this.lastBlock.getPromise()).height);
    }
    if (this.appSetting.getHeight() === last_block.height && (await this.lastBlock.getPromise()).id === last_block.id) {
      return;
    }
    // 更新缓存中的最新区块
    if (!(await this.checkBlockIdInBlockDB(last_block.id))) {
      // 将最新区块插入到数据库中
      await this.blockDb.insert(this.formatBlockData(last_block),{replace:true}).catch(err => console.warn("更新最新区块失败", last_block, err));
    } else {
      // 如果本地已经有这个区块，而且我本地的最高区块比他还高，那么应该使用我本地的作为正确的区块
      const heighter_blocks = await this.blockDb.find({
        height: { $gt: last_block },
      });
      //整理出一条正确的长链，所用前一个块的id作为key
      const block_map = new Map<string, TYPE.BlockModel>();
      heighter_blocks.forEach(lock_block => {
        block_map.set(lock_block.previousBlock, lock_block);
      });
      let pre_block = last_block;
      do {
        const next_block = block_map.get(pre_block.id);
        if (!next_block) {
          last_block = pre_block;
          break;
        }
        pre_block = next_block;
      } while (true);
    }
    // 更新轮次计时器
    this.round_end_time = new Date(Date.now() + this.appSetting.getBlockNumberToRoundEnd(last_block.height) * this.appSetting.BLOCK_UNIT_TIME);
    // 如果同步进度是最新区块的话，那么继续跟进这个进度
    if (this.appSetting.share_settings.sync_progress_height === this.appSetting.getHeight()) {
      this.appSetting.share_settings.sync_progress_height = last_block.height;
    }
    // 更新高度
    this.appSetting.setHeight(last_block.height);
  }
  bindIOBlockChange() {
    const encoder = this.io.io["encoder"];
    const ENCODE_SYMBOL = Symbol.for("encode");
    encoder[ENCODE_SYMBOL] = encoder.encode;
    const peerService = this.peerService;
    const self = this;
    const io_origin = AppSettingProvider.SERVER_URL;
    // 不改原型链，只针对当前的这个链接对象进行修改
    encoder.encode = function(obj, callback) {
      this[ENCODE_SYMBOL](obj, (buffer_list, ...args) => {
        if (buffer_list instanceof Array) {
          let acc_flow = 0;
          buffer_list.forEach(data_item => {
            if (typeof data_item == "string") {
              acc_flow += getUTF8ByteSize(data_item);
            } else if (data_item instanceof ArrayBuffer) {
              acc_flow += data_item.byteLength;
            }
          });
          if (acc_flow) {
            // console.log("上行流量", acc_flow);
            self.peerService.updatePeerFlow(io_origin, acc_flow);
          }
        }
        callback(buffer_list, ...args);
      });
    };
    this.io.io["engine"].on("data", data_item => {
      let acc_flow = 0;
      if (typeof data_item == "string") {
        acc_flow += getUTF8ByteSize(data_item);
      } else if (data_item instanceof ArrayBuffer) {
        acc_flow += data_item.byteLength;
      }
      if (acc_flow) {
        // console.log("下行流量", acc_flow);
        self.peerService.updatePeerFlow(io_origin, acc_flow);
      }
    });
    this.io.on("blocks/change", async data => {
      // 计算流量大小
      const flow = getJsonObjectByteSize(data) /*返回的JSON对象大小*/ + 19 /*基础消耗*/;
      this.appSetting.share_settings.sync_data_flow += flow; // 同步的流量
      this.appSetting.settings.contribution_flow += flow; // 同时也属于贡献的流量
      /*更新数据库中的流量使用信息*/
      this.peerService.updatePeerFlow(io_origin, flow);

      console.log(`%c区块更新 ${new Date().toLocaleString()}`, "color:green;background-color:#eee;font-size:1.2rem");

      this._updateHeight(data.lastBlock);

      // 更新预期交易区块
      this._expectblock_uncommited = 0;
      this._expectblock_fee_reward = 0;
      this.getExpectBlockInfo().then(expect_block => {
        this.tryEmit("EXPECTBLOCK:CHANGED", expect_block);
      });
    });
    const io = this.io;
    let ti = setInterval(() => {
      if (io === this.io) {
        this.peerService.updatePeerDuration(io_origin, 1);
      } else {
        clearInterval(ti);
      }
    }, 1000);
  }
  private async _listenGetAndSetHeight() {
    this.bindIOBlockChange();
    this.fetch.on("ononline", () => {
      // 联网的时候，更新一下区块
      this._updateHeight();
    });
    this.io.on("connect", () => {
      // websocket连接上的时候更新
      this._updateHeight();
    });
    this.fetch.on("onoffline", () => {
      this._updateHeight();
    });
    // 安装未处理交易的预估
    this._listenUnconfirmTransaction();
  }
  private _download_worker?: DownloadBlockChainMaster;
  getDownloadWorker() {
    if (!this._download_worker) {
      const download_worker = (this._download_worker = new DownloadBlockChainMaster());
      this.appSetting.on("changed@share_settings.enable_sync_progress_blocks", enable_sync_progress_blocks => {
        const req_id = this._download_req_id_acc++;
        download_worker.postMessage({
          cmd: "toggleSyncBlocks",
          toggle_sync_blocks: enable_sync_progress_blocks,
          req_id,
        });
      });
      // registerWorkerHandle(download_worker);
    }
    return this._download_worker;
  }
  private _download_req_id_acc = 0;
  private _sync_lock?: {
    worker: DownloadBlockChainMaster;
    req_id: number;
    task: PromiseOut<void>;
  };
  async syncBlockChain(max_end_height: number) {
    if (this._sync_lock) {
      return this._sync_lock;
    }
    const download_worker = this.getDownloadWorker();
    const req_id = this._download_req_id_acc++;
    let cg;
    download_worker.postMessage({
      cmd: "syncBlockChain",
      NET_VERSION: AppSettingProvider.NET_VERSION,
      webio_path: this.fetch.webio.io_url_path,
      magic: await this.magic.promise,
      max_end_height,
      req_id,
    });
    const task_name = `同步区块链至:${max_end_height}`;
    const task = new PromiseOut<void>();
    const onmessage = e => {
      const msg = e.data;
      if (msg && msg.req_id === req_id) {
        // console.log("bs", msg);
        switch (msg.type) {
          case "start-verifier":
            this.appSetting.share_settings.is_syncing_blocks = true;
            this.appSetting.share_settings.sync_is_verifying_block = true;
            break;
          case "end-verifier":
            this.appSetting.share_settings.sync_is_verifying_block = false;
            break;
          case "start-sync":
            this.appSetting.share_settings.is_syncing_blocks = true;
            this.appSetting.share_settings.sync_progress_height = 1;
            console.log("开始同步", task_name);
            break;
          case "start-download":
            console.log("开始子任务", msg.data);
            break;
          case "end-download":
            console.log("完成子任务", msg.data);
            break;
          case "end-sync":
            this.appSetting.share_settings.sync_progress_height = this.appSetting.getHeight();
            this.appSetting.share_settings.sync_progress_blocks = 100;
            this.appSetting.share_settings.is_syncing_blocks = false;
            console.log("结束同步", task_name);
            task.resolve();
            break;
          case "process-height":
            this.appSetting.share_settings.sync_progress_height = msg.data.cursorHeight;
            break;
          case "use-flow":
            {
              let flow = (+msg.data.up || 0) + (+msg.data.down || 0);
              this.appSetting.share_settings.sync_data_flow += flow;
              /*更新数据库中的流量使用信息*/
              this.peerService.updatePeerFlow(AppSettingProvider.SERVER_URL, flow);
            }
            break;
          case "progress":
            // console.log("下载中", task_name, msg.data);
            this.appSetting.share_settings.sync_progress_blocks = msg.data;
            this.tryEmit("BLOCKCHAIN:CHANGED");
            break;
          case "error":
            this.appSetting.share_settings.sync_is_verifying_block = false;
            this.appSetting.share_settings.is_syncing_blocks = false;
            console.error(msg);
            task.reject(msg.data);
            break;
          default:
            console.warn("unhandle message:", msg);
            break;
        }
      }
    };
    download_worker;
    download_worker.addEventListener("message", onmessage);
    cg = () => download_worker.removeEventListener("message", onmessage);
    // 不论如何都将监听函数移除掉
    task.promise.then(cg, cg);
    const res = {
      worker: download_worker,
      req_id,
      task,
    };
    this._sync_lock = res;
    return res;
  }
  async downloadBlockInWorker(startHeight: number, endHeight: number, max_end_height: number) {
    // 缺少最新区块，下载补全
    const download_worker = this.getDownloadWorker();
    const req_id = this._download_req_id_acc++;
    let cg;
    download_worker.postMessage({
      NET_VERSION: AppSettingProvider.NET_VERSION,
      cmd: "download",
      webio_path: this.fetch.webio.io_url_path,
      magic: await this.magic.promise,
      startHeight,
      endHeight,
      max_end_height,
      req_id,
    });
    const task_name = `补全区块数据${startHeight} ~ ${endHeight}`;
    const task = new PromiseOut<void>();
    const onmessage = e => {
      const msg = e.data;
      if (msg && msg.req_id === req_id) {
        // console.log("bs", msg);
        switch (msg.type) {
          case "start-download":
            console.log("开始", task_name);
            break;
          case "end-download":
            console.log("完成", task_name);
            task.resolve();
            break;
          case "use-flow":
            this.appSetting.share_settings.sync_data_flow += (+msg.data.up || 0) + (+msg.data.down || 0);
            break;
          case "progress":
            // console.log("下载中", task_name, msg.data);
            this.tryEmit("BLOCKCHAIN:CHANGED");
            break;
          case "error":
            task.reject(msg.data);
            break;
          default:
            console.warn("unhandle message:", msg);
            break;
        }
      }
    };
    download_worker.addEventListener("message", onmessage);
    cg = () => download_worker.removeEventListener("message", onmessage);
    // 不论如何都将监听函数移除掉
    task.promise.then(cg, cg);
    return {
      worker: download_worker,
      req_id,
      task,
    };
  }
  /**更新最新的区块，并尝试下载破损的区块链数据*/
  async updateLastBlockAndTryDownloadDestoryBlocks(lastBlock: TYPE.BlockModel) {
    const block: any = {};
    [
      "version",
      "timestamp",
      "totalAmount",
      "totalFee",
      "reward",
      "numberOfTransactions",
      "payloadLength",
      "payloadHash",
      "generatorPublicKey",
      "blockSignature",
      "previousBlock",
      "id",
      "height",
      "blockSize",
      "remark",
    ].forEach(key => {
      // 过滤字段，只用需要的
      block[key] = lastBlock[key];
    });

    // 获取目前高度最高的区块
    const cur_lastBlock = await this.getLocalLastBlock();
    if (cur_lastBlock) {
      if (cur_lastBlock.height >= lastBlock.height) {
        // TOOD：拜占庭询问区块是否正确，然后进行更新或者拉黑名单的操作
        console.error("区块数移除，存在比当前最新区块更高的区块");
        return;
      }
    }

    await this.blockDb.insert(block,{replace:true}).catch(err => console.warn(`[${lastBlock.height}]`, err.message));
    // 新的输入插入后，就要通知更新区块链
    this.tryEmit("BLOCKCHAIN:CHANGED");
    if (cur_lastBlock) {
      if (lastBlock.height - cur_lastBlock.height > 1) {
        const startHeight = cur_lastBlock.height + 1;
        const endHeight = lastBlock.height - 1;
        // 缺少最新区块，下载补全
        const { task } = await this.downloadBlockInWorker(startHeight, endHeight, lastBlock.height);
        await task.promise;
      }
    }
  }

  private _listenUnconfirmTransaction() {
    this.io.on("transactions/unconfirm", data => {
      const tran: TransactionModel = data.transaction;
      this.appSetting.settings.detal_tran_num += 1;
      this._expectblock_uncommited += 1;
      this._expectblock_fee_reward += parseFloat(tran.fee);
      this.getExpectBlockInfo().then(expect_block => {
        this.tryEmit("EXPECTBLOCK:CHANGED", expect_block);
      });
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

  /**
   * 获取当前区块链的块高度
   * @returns {Promise<any>}
   */
  async getLastBlock() {
    if (await this.fetch.webio.getOnlineStatus()) {
      let last_block = await this.fetch.get<TYPE.BlockResModel>(this.GET_LAST_BLOCK_URL).then(res => res.block as TYPE.SingleBlockModel);
      if (await this.checkBlockIdInBlockDB(last_block.id)) {
        // 如果本地已经有这个区块，而且我本地的最高区块比他还高，那么应该使用我本地的作为正确的区块
        const heighter_blocks = await this.blockDb.find({
          height: { $gt: last_block },
        });
        //整理出一条正确的长链，所用前一个块的id作为key
        const block_map = new Map<string, TYPE.BlockModel>();
        heighter_blocks.forEach(lock_block => {
          block_map.set(lock_block.previousBlock, lock_block);
        });
        let pre_block = last_block;
        do {
          const next_block = block_map.get(pre_block.id);
          if (!next_block) {
            last_block = pre_block;
            break;
          }
          pre_block = next_block;
        } while (true);
      }
      return last_block;
    } else {
      return this.getLocalLastBlock();
    }
  }

  lastBlock = new AsyncBehaviorSubject<TYPE.SingleBlockModel>(promise_pro => {
    return promise_pro.follow(this.getLastBlock());
  });

  /**
   * 获取输入的时间戳的完整时间戳,TODO: 和minSer重复了
   * @param timestamp
   */
  getFullTimestamp(timestamp: number) {
    const fullTimestamp = (timestamp + AppSettingProvider.seedDateTimestamp) * 1000;
    return fullTimestamp;
  }

  /**
   * 根据块ID获取块信息，返回一个对象
   * @param {string} blockId
   * @returns {Promise<any>}
   */
  async getBlockById(blockId: string) {
    const data = await this.fetch.get<TYPE.BlockResModel>(this.GET_BLOCK_BY_ID, {
      search: {
        id: blockId,
      },
    });

    return data.block;
  }

  /**
   * 返回根据高度搜索到的块，返回一个对象
   * @param {number} height
   * @returns {Promise<any>}
   */
  async getBlockByHeight(height: number): Promise<TYPE.BlockModel> {
    let data = await this.fetch.get<any>(this.GET_BLOCK_BY_QUERY, {
      search: {
        height: height,
      },
    });

    return data.blocks[0];
  }

  /**
   * 返回根据地址搜索的块，返回一个数组
   * @param {string} address
   * @returns {Promise<any>}
   */
  async getBlocksByAddress(address: string): Promise<TYPE.BlockModel> {
    let data = await this.fetch.get<any>(this.GET_BLOCK_BY_QUERY, {
      search: {
        generatorId: address,
      },
    });

    return data.blocks[0];
  }

  /**
   * 搜索块，可以搜索高度、地址和ID任一
   * @param {string} query
   * @returns {Promise<any>}
   */
  async searchBlocks(query: string): Promise<TYPE.BlockModel[]> {
    //如果是纯数字且不是以0开头就查高度
    if (/[1-9][0-9]*/.test(query)) {
      const query_num = parseFloat(query) * 1;
      let data = await this.getBlockByHeight(query_num);
      // if (data.length > 0) {
      return [data];
      // }
    } else {
      //首先查创块人
      let data1 = await this.getBlocksByAddress(query);
      if (data1) {
        return [data1];
      }

      //不是创块人则搜索ID
      let data2 = await this.getBlockById(query);
      if (data2) {
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
    let data = await this.fetch.get<TYPE.BlockListResModel>(this.GET_BLOCK_BY_QUERY, {
      search: query,
    });

    return data;
  }

  /**
   * 判断当前的块是否延迟，返回块数组
   * @param list
   */
  blockListHandle(list: TYPE.BlockModel[], per_item?: TYPE.BlockModel, end_item?: TYPE.BlockModel): TYPE.BlockModel[] {
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
    sort: 1 | -1 = 1 // 默认增序
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
    sort: 1 | -1 = 1 // 默认增序
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

  private _expectblock_uncommited = 0;
  private _expectblock_fee_reward = 0;
  /**
   * 获取未来一个块的预期信息
   * @param:amount 根据最近n个块来获取平均值
   * 返回平均收益、平均手续费、未确认交易数
   */
  async getExpectBlockInfo(amount: number = 5) {
    // var data: TYPE.UnconfirmBlockModel;
    // if (!navigator.onLine) {
    //   data = {
    //     reward: 3500000000 + this._expectblock_fee_reward,
    //     fee: this._expectblock_fee_reward,
    //     uncommited: this._expectblock_uncommited,
    //     height: this.appSetting.getHeight() + 1,
    //   };
    // } else {
    //   amount = amount < 57 ? amount : 57;
    //   let uncommited = this._expectblock_uncommited; // await this.getPoolUnconfirmed();
    //   let blockInfo = await this.getAvgInfo(amount);
    //   blockInfo.reward =parseFloat(blockInfo.reward as any)+ this._expectblock_fee_reward
    //   blockInfo.fee
    //   data = {
    //     ...blockInfo,
    //     uncommited,
    //     height: this.appSetting.getHeight() + 1,
    //   };
    // }

    // return data;
    return {
      reward: 3500000000 + this._expectblock_fee_reward,
      fee: this._expectblock_fee_reward,
      uncommited: this._expectblock_uncommited,
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
        return delegate ? delegate.producedblocks : 0;
      })
    );
  }
}
