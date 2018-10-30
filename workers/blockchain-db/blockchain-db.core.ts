import EventEmitter from "eventemitter3";
import * as IDB_VK from "idb-keyval";
import { AOT, AOT_Placeholder } from '../../src/bnqkl-framework/lib/AOT';
import { PromiseOut, PromiseType, PromiseReturnType } from '../../src/bnqkl-framework/PromiseExtends';
import { DB_Config, BlockModel, DB_Item_Index } from "./const";
import debug from "debug";
import { CacheDataPool, CacheDataRef } from "./CacheDataRef";
const log = debug("blockchain-db");

enum HAS_DATA {
  UNINIT,
  NO,
  LOADING,
  YES,
}
type Cached_Page_Data_Req = {
  page_index: number;
  has_data: HAS_DATA;
  data_req: PromiseOut<void>;
  /**Lastest visited time */
  lvt: number;
  hot: number;
  hot_count_ti?: number;
}
type Cached_Page_WithData = {
  data: Array<BlockModel | undefined>;
} & Cached_Page_Data_Req;

export class BlockchainDBCore extends EventEmitter {
  //#region 配置的初始化
  private _init_aot = new AOT();
  constructor(public readonly magic: string, opts: {
    CACHE_NUM?: number
  } = {}) {
    super();
    this._init_aot.autoRegister(this);
    this._db_init.then(() => {
      this._init_aot.compile(true)
    });
    /// config

  }

  private readonly DB_CONFIG_KEY = this.magic + "-CONFIG";
  private DB_PAGE_KEY(page: number) {
    return this.magic + "+PAGE-" + page;
  }

  private _db_init = this._initConfig();
  private async _initConfig() {
    const { DB_CONFIG_KEY } = this;
    let dbconfig = await IDB_VK.get<DB_Config>(DB_CONFIG_KEY);
    if (dbconfig) {
      dbconfig = {
        total_num: 0,
        page_size: 1e4,// 默认以 1W 条数据为一组
      }
      await IDB_VK.set(DB_CONFIG_KEY, dbconfig);
    }
    this._dbconfig = dbconfig;
    /// 开始建立索引
    const id_height_indexs = new Map<string, number>();
    const height_id_indexs = new Map<number, string>();
    for (var i = 0; i < dbconfig.total_num; i += dbconfig.page_size) {
      const page_index = (i / dbconfig.page_size) | 0;
      const block_list = await this._readDataFromDB(page_index);
      if (!block_list) {
        continue;
      }
      for (var offset = 0; offset < block_list.length; offset += 1) {
        const block = block_list[offset];
        if (!block) {
          continue
        }
        id_height_indexs.set(block.id, block.height);
        height_id_indexs.set(block.height, block.id);
      }
    }
    this._id_height_indexs = id_height_indexs;
    this._height_id_indexs = height_id_indexs;
    return {
      dbconfig,
      id_height_indexs,
      height_id_indexs,
    };
  }
  //#endregion
  //#region 索引
  private _dbconfig!: DB_Config;
  private _id_height_indexs!: Map<string, number>;
  private _height_id_indexs!: Map<number, string>;
  @AOT_Placeholder.Wait("_db_init")
  getBlockIdHeightIndexs() {
    return Promise.resolve(this._id_height_indexs);
  }

  //#region 取数据
  @AOT_Placeholder.Wait("_db_init")
  getBlockHeightIdIndexs() {
    return Promise.resolve(this._height_id_indexs);
  }
  //#endregion

  /**获取指定高度的数据 */
  @AOT_Placeholder.Wait("_db_init")
  async getByHeight(height: number) {
    if (!this._height_id_indexs.has(height)) {
      return
    }
    return this._getByHeight(height);
  }
  private async _getByHeight(height: number) {
    const pageData = await this._getPageData(height);
    return pageData.getItem(height % this._dbconfig.page_size)
  }
  /**
   * 获取指定范围的数据
   * @param gte start height
   * @param lte end height
   */
  @AOT_Placeholder.Wait("_db_init")
  async getByHeightRange(gte: number, lte: number) {
    const pageDataCache = new Map<number, CacheDataRef>()
    const res: (BlockModel | undefined)[] = [];
    for (var i = gte; i <= lte; i += 1) {
      const height = i;
      if (!this._height_id_indexs.has(height)) {
        return
      }
      const offset = height % this._dbconfig.page_size;
      const pageData = await this._getPageDataWithAutoCache(height, pageDataCache);
      res.push(pageData[offset]);
    }
    return res;
  }
  /**
   * 根据区块id获取区块数据
   * @param id 区块ID
   */
  @AOT_Placeholder.Wait("_db_init")
  async getById(id: string) {
    const height = this._id_height_indexs.get(id);
    if (typeof height !== 'number') {
      return
    }
    return this._getByHeight(height)
  }
  //#endregion
  //#region 批量插入数据
  @AOT_Placeholder.Wait("_db_init")
  async upsertList(block_list: BlockModel[]) {
    for (var _block of block_list) {

    }
  }
  @AOT_Placeholder.Wait("_db_init")
  async upsert(block: BlockModel) {
    const pageData = await this._getPageData(block.height);
    const offset = block.height % this._dbconfig.page_size;
    pageData[offset] = block;
  }
  //#endregion

  /**
   * 自动的页面缓存获取
   * @param height
   */
  private async _getPageDataWithAutoCache(height: number, cache: Map<number, CacheDataRef>) {
    const page = (height / this._dbconfig.page_size) | 0;
    let pageData = cache.get(page);
    if (!pageData) {
      pageData = await this.cacheDataPool.getCacheDataRef(page);
      cache.set(page, pageData);
    }
    return await pageData.getData();
  }
  private async _getPageData(height: number) {
    const page = (height / this._dbconfig.page_size) | 0;
    return await this.cacheDataPool.getCacheDataRef(page);
  }


  //#region 缓存管理
  cacheDataPool = new CacheDataPool({
    getPageKey: this.DB_PAGE_KEY.bind(this),
    max_cache_page_num: 10,
    cg_interval: 1e3,
    auto_cg_hot_line: 0.2,
  });
  // /**检查CG的定时器间隔 */
  // public CG_INTERVAL = 1e3;
  // /**默认最多缓存N个分页的数据 */
  // public MAX_CACHE_PAGE_NUM = 10;
  // /**访问热度低于这个阈值自动释放 */
  // public AUTO_CG_HOT_LINE = 0.2;
  // /**缓存请求 */
  // private _cache_page_data_req = new Map<number, Cached_Page_Data_Req>();
  // /**带数据的缓存 */
  // private _cache_page_widthdata = new Map<number, Cached_Page_WithData>();
  // public CG() {
  //   this._cache_page_widthdata.clear();
  // }
  // /**获取指页也数据，从IndexedDB获取 */
  private _readDataFromDB(page_index: number) {
    const page_key = this.DB_PAGE_KEY(page_index);
    return IDB_VK.get<Array<BlockModel | undefined> | undefined>(page_key);
  }
  // private __calcCacheCanKeep(cache_data_req: Cached_Page_Data_Req) {
  //   const { _cache_page_widthdata } = this;
  //   if (_cache_page_widthdata.size > this.MAX_CACHE_PAGE_NUM) {
  //     const hot_list = [..._cache_page_widthdata.values()].map(c => c.hot).sort();
  //     return cache_data_req.hot >= hot_list[hot_list.length - this.MAX_CACHE_PAGE_NUM];
  //   }
  //   // 低于设定的最低阈值，进行数据回收
  //   return cache_data_req.hot >= this.AUTO_CG_HOT_LINE;
  //   // this._cache_page_widthdata.delete(cache_data_req.page_index);
  // }
  // /**获取指页也数据，存入缓存中*/
  // private _getByPageFromCache(page_index: number) {
  //   let cache_data_req = this._cache_page_data_req.get(page_index);
  //   if (!cache_data_req) {
  //     cache_data_req = {
  //       has_data: HAS_DATA.UNINIT,// 空的状态下，会消耗资源去更新缓存，看是否变成有了
  //       data_req: new PromiseOut(),
  //       page_index,
  //       lvt: 0,
  //       hot: 0,
  //       hot_count_ti: undefined
  //     };
  //     this._cache_page_data_req.set(page_index, cache_data_req);
  //   }
  //   const NOW = Date.now();
  //   // 每多一次请求，更新 hot 与 lvt
  //   cache_data_req.hot += Math.max(1, Math.min(1000 / (NOW - cache_data_req.lvt), 512));
  //   cache_data_req.lvt = NOW;
  //   return this._activeCachePageWidthData(cache_data_req);
  // }
  // /**激活缓存对象，如果有数据，进入CG回收状态 */
  // private async _activeCachePageWidthData(cache_data_req: Cached_Page_Data_Req): Promise<(BlockModel | undefined)[]> {
  //   let cache_widthdata = this._cache_page_widthdata.get(cache_data_req.page_index)
  //   if (cache_widthdata) {
  //     return cache_widthdata.data;
  //   } else if (cache_data_req.has_data === HAS_DATA.UNINIT) {
  //     // 请求进行初始化
  //     cache_data_req.has_data = HAS_DATA.LOADING;
  //     try {
  //       const data = await this.__getByP(cache_data_req.page_index);
  //       cache_data_req.has_data = data ? HAS_DATA.YES : HAS_DATA.NO;
  //       if (data) {
  //         // 开始自动计时
  //         cache_widthdata = { ...cache_data_req, data }
  //         this._cache_page_widthdata.set(cache_data_req.page_index, cache_widthdata);
  //         // 每过一段时间，进行一次CG回收的检查
  //         setTimeout(function check_hot() {
  //           if (!cache_widthdata) {
  //             return;
  //           }
  //           cache_widthdata.hot /= 2;
  //           if (this.__calcCacheCanKeep(cache_widthdata)) {
  //             setTimeout(check_hot, this.CG_INTERVAL);
  //           } else {
  //             /// 释放内存
  //             this._cache_page_widthdata.delete(cache_data_req.page_index);
  //             cache_widthdata = undefined;
  //           }
  //         }, this.CG_INTERVAL);
  //       }
  //       cache_data_req.data_req.resolve();
  //     } catch (err) {
  //       cache_data_req.data_req.reject(err);
  //     }
  //   } else if (cache_data_req.has_data === HAS_DATA.LOADING) {
  //     await cache_data_req.data_req;
  //     return this._activeCachePageWidthData(cache_data_req);
  //   }
  //   throw new Error("should not happend.")
  // }
  // //#endregion
}
