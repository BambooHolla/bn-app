import { FLP_Tool } from "../../bnqkl-framework/FLP_Tool";
import { AppSettingProvider } from "../app-setting/app-setting";
import { AppFetchProvider } from "../app-fetch/app-fetch";

import *  as TYPE from './block.types';
import { BlockchainDB } from "../../../workers/blockchain-db";
import { RangeHelper } from "./helper";

export abstract class BlockQuery extends FLP_Tool {
  constructor(
    public appSetting: AppSettingProvider,
    public fetch: AppFetchProvider,
  ) {
    super();
  }
  /**获取区块链数据库 */
  abstract getBlockDB(): Promise<BlockchainDB<TYPE.BlockModel>>;

  readonly GET_LAST_BLOCK_URL = this.appSetting.APP_URL("/api/blocks/getLastBlock");
  private readonly GET_BLOCK_BY_QUERY = this.appSetting.APP_URL("/api/blocks/");
  private readonly GET_BLOCK_BY_ID = this.appSetting.APP_URL("/api/blocks/get");

  //#region 从节点直接获取数据的API

  /**
   * 获取区块列表
   * **强制从节点获取数据**
   */
  protected async _fetchBlockListFromPeer(search) {
    await this.fetch.webio.getOnlineStatus();
    const data = await this.fetch.forceNetwork(true).get<TYPE.BlockListResModel>(this.GET_BLOCK_BY_QUERY, {
      search,
    });
    if (search.offset === 0 && search.orderBy === "height:desc") {
      this.activeSyncWithPeerStatus(Date.now() - this.baseConfig.BLOCK_UNIT_TIME / 2);
    }
    // 将数据保存到数据库中
    this.getBlockDB().then(db => db.upsertList(data.blocks));
    return data.blocks;
  }

  /**
   * 获取指定节点的区块列表
   * **强制从特定节点特定版本获取数据**
   */
  fetchBlockListFromPeer(search, custom_origin?: string, backend_version?: string) {
    if (typeof custom_origin === "string") {
      this.GET_BLOCK_BY_QUERY.disposableServerUrl(custom_origin);
    }
    if (typeof backend_version === "string") {
      this.GET_BLOCK_BY_QUERY.disposablBackendVersion(backend_version);
    }
    return this.fetch.forceNetwork(true).get<TYPE.BlockListResModel>(this.GET_BLOCK_BY_QUERY, {
      search,
    }).then(data => data.blocks);
  }
  /**
   * 获取指定节点的最新区块
   * **强制从特定节点特定版本获取数据**
   */
  fetchLastBlockFromPeer(custom_origin?: string, backend_version?: string) {
    if (typeof custom_origin === "string") {
      this.GET_BLOCK_BY_QUERY.disposableServerUrl(custom_origin);
    }
    if (typeof backend_version === "string") {
      this.GET_BLOCK_BY_QUERY.disposablBackendVersion(backend_version);
    }
    return this.fetch.forceNetwork(true).get<TYPE.BlockResModel>(this.GET_LAST_BLOCK_URL).then(data => data.block as TYPE.SingleBlockModel);
  }
  /**
   * 根据区块ID获取区块
   * **强制从节点获取数据**
   */
  protected async _fetchIdBlockFromPeer(block_id) {
    await this.fetch.webio.getOnlineStatus();
    const data = await this.fetch.forceNetwork(true).get<TYPE.BlockResModel>(this.GET_BLOCK_BY_ID, {
      search: {
        id: block_id,
      },
    });
    // 将数据保存到数据库中
    this.getBlockDB().then(db => db.upsert(data.block));
    return data.block;
  }

  /**
   * 获取节点内存中最后一个区块的信息
   * **强制从节点获取数据**
   */
  private async _fetchLastBlockFromPeer() {
    // const last_block = await this.fetch.get<TYPE.BlockResModel>(this.GET_LAST_BLOCK_URL).then(res => res.block as TYPE.SingleBlockModel);
    // this.activeSyncWithPeerStatus(Date.now() - this.baseConfig.BLOCK_UNIT_TIME / 2);
    const last_blocks = await this._fetchBlockListFromPeer({ offset: 0, limit: 1, orderBy: "height:desc" })
    return last_blocks[0];
  }


  /**节点每次请求区块最大返回的区块数量 */
  protected _peer_fetch_block_onetime_limit = 100;
  protected get _peer_fetch_block_onetime_diff() {
    return this._peer_fetch_block_onetime_limit - 1;
  };

  /**
   * 自动分页获取区块列表
   * **强制从节点获取数据**
   */
  protected async _fetchRangeBlocksFromPeerWithAutoSplit(from_height: number, to_height: number, orderBy?: string) {
    const { _peer_fetch_block_onetime_diff: max_diff } = this;
    let start_height = from_height;
    const res: TYPE.BlockModel[] = [];
    do {
      const end_height = Math.min(start_height + max_diff, to_height);
      res.push(...(await this._fetchBlockListFromPeer({
        startHeight: start_height,
        endHeight: end_height,
        orderBy
      })));
      start_height = end_height + 1;
    } while (start_height < to_height);
    return res
  }
  //#endregion

  //#region 混合本地数据库的区块请求方案

  /**根据高度获取区块 */
  async getBlockByHeight(height: number) {
    const db = await this.getBlockDB();
    let block = await db.getByHeight(height);
    if (!block) {
      block = (await this._fetchBlockListFromPeer({ height }))[0];
    }
    return block;
  }
  /**根据块ID获取区块 */
  async getBlockById(block_id: string) {
    const db = await this.getBlockDB();
    let block = await db.getById(block_id);
    if (!block) {
      block = await this._fetchIdBlockFromPeer(block_id);
    }
    return block;
  }

  /**根据范围获取区块高度 */
  async getBlocksByRange(start_height: number, end_height: number, sort: 1 | -1 = -1) {
    // const height_diff = end_height - start_height > 100;
    const db = await this.getBlockDB();
    const local_blocks = await db.getByHeightRange(start_height, end_height);
    // 移除已经有的区块
    const range_helper = new RangeHelper(start_height, end_height);
    local_blocks.forEach(block => {
      range_helper.removeOne(block.height)
    });
    // 去节点中获取缺少的区块
    for (var range of range_helper.ranges) {
      local_blocks.push(...(await this._fetchRangeBlocksFromPeerWithAutoSplit(range.start, range.end)));
    }
    return local_blocks.sort((a, b) => (a.height - b.height) * sort);
  }


  /**
   * 判定是否与节点处于同步
   */
  private _last_sync_time = 0;
  isSyncWithPeer() {
    return this._last_sync_time + this.baseConfig.BLOCK_UNIT_TIME >= Date.now();
  }
  /**
   * 激发最后一次同步的时间
   *
   * 1. 最后一次获取到区块推送（block/change）的时间是否<=出块间隔时间
   * 2. 直接与节点进行通讯，使用 getLastBlock 或者 queryBlock(offset:0) 来查询节点并返回
   */
  activeSyncWithPeerStatus(now = Date.now()) {
    this._last_sync_time = now;
  }

  /**获取最高区块的高度 */
  async getLastBlockHeight() {
    const is_use_local_db = this.fetch.onLine ? this.isSyncWithPeer() : true;
    if (is_use_local_db) {
      const db = await this.getBlockDB();
      return db.getMaxHeight();
    }
    const last_block = await this._fetchLastBlockFromPeer();
    return last_block.height;
  }
  /**获取最新的区块 */
  async getLastBlock() {
    const last_block_height = await this.getLastBlockHeight();
    return this.getBlockByHeight(last_block_height);
  }

  /**获取最前的几个区块 */
  async getTopBlocks(
    top_num: number
  ): Promise<TYPE.BlockModel[]> {
    const last_block_height = await this.getLastBlockHeight();
    return this.getBlocksByRange(last_block_height - top_num - 1, last_block_height);
  }

  //#endregion

  //#region 本地数据库的一些辅助函数
  async getLocalLastBlock() {
    const db = await this.getBlockDB()
    return db.getByHeight(await db.getMaxHeight());
  }
  //#endregion
}
