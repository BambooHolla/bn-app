import EventEmitter from "eventemitter3";
import * as IDB_VK from "idb-keyval";
import { AOT, AOT_Placeholder } from '../../src/bnqkl-framework/lib/AOT';
import { PromiseOut, PromiseType, PromiseReturnType } from '../../src/bnqkl-framework/PromiseExtends';
import { DB_Config, DB_Item_Index, BlockBaseModel, CacheBlockList, BlockFilterFunction, QueryTask, BlockFilterWrapper, BlockFilterBaseWrapper } from "./const";
import { CacheDataPool, CacheDataRef, } from "./CacheDataRef";

import debug from "debug";
import { HeightList } from "./HeightList";
const log = debug("blockchain-db:core");

export class BlockchainDBCore<T extends BlockBaseModel> extends EventEmitter {
  //#region 配置的初始化
  private _init_aot = new AOT();
  private _default_page_size = 100;
  constructor(public readonly magic: string, opts: {
    CACHE_NUM?: number,
    PAGE_SIZE?: number
  } = {}) {
    super();
    this._init_aot.autoRegister(this);
    this._db_init.then(() => {
      this._init_aot.compile(true)
    });
    /// config
    if (typeof opts.PAGE_SIZE === "number") {
      this._default_page_size = opts.PAGE_SIZE;
    }
  }

  protected readonly DB_CONFIG_KEY = this.magic + "-CONFIG";
  protected DB_PAGE_KEY(page: number) {
    return this.magic + "+PAGE-" + page;
  }

  protected _db_init = this._initConfig();
  private async _initConfig() {
    const { DB_CONFIG_KEY } = this;
    let dbconfig = await IDB_VK.get<DB_Config | undefined>(DB_CONFIG_KEY);
    if (!dbconfig) {
      dbconfig = {
        max_height: 0,
        page_size: this._default_page_size,//1e4,// 默认以 1W 条数据为一组
      }
      await IDB_VK.set(DB_CONFIG_KEY, dbconfig);
    }
    this._dbconfig = dbconfig;
    /// 开始建立索引
    const init_config_log = debug("blockchain-db:core:create-indexs");
    init_config_log("开始建立索引 %o", dbconfig);
    const indexlog = debug("blockchain-db:core:indexs-item");
    const id_height_indexs = new Map<string, number>();
    const height_id_indexs = new Map<number, string>();
    const height_list = new HeightList();
    let max_height = 0;
    for (var i = 0; i < dbconfig.max_height; i += dbconfig.page_size) {
      const page_index = (i / dbconfig.page_size) | 0;
      const block_list = await this._readDataFromDB(page_index);
      if (!block_list) {
        indexlog("查询到 %o 页，无数据", page_index);
        continue;
      }
      indexlog("查询到 %o 页，将建立 %o 条数据索引", page_index, block_list.size);
      const _height_list: number[] = [];
      block_list.forEach(block => {
        _height_list.push(block.height);
        id_height_indexs.set(block.id, block.height);
        height_id_indexs.set(block.height, block.id);
        block.height > max_height && (max_height = block.height);
      });
      height_list.pushList(_height_list);
    }
    init_config_log("索引建立完成，共 %o 条数据", id_height_indexs.size);
    this._id_height_indexs = id_height_indexs;
    this._height_id_indexs = height_id_indexs;
    this._height_list = height_list;
    // 尝试更新配置
    this._compareMaxHeight(max_height);

    return {
      dbconfig,
      id_height_indexs,
      height_id_indexs,
    };
  }
  /**对比本地totalnum，进行更新 */
  private _compareMaxHeight(max_height: number) {
    if (this._dbconfig.max_height !== max_height) {
      this._dbconfig.max_height = max_height;
      this._saveDBConfig();
    }
  }
  /**使用height_list来更新最高区块 */
  private _getMaxHeightFromHeightList() {
    const { height_list } = this;
    const max_height = height_list[height_list.length - 1] || 0;
    this._compareMaxHeight(max_height);
  }
  private _save_dbconfig_quene?: Promise<any>
  /**是否需要再次执行写入 */
  private _save_dbconfig_dirty = false;
  private _saveDBConfig() {
    if (!this._save_dbconfig_quene) {
      this._save_dbconfig_quene = Promise.resolve().then(() => {
        return IDB_VK.set(this.DB_CONFIG_KEY, this._dbconfig)
      }).then(() => {
        this._save_dbconfig_quene = undefined;
        if (this._save_dbconfig_dirty) {
          this._save_dbconfig_dirty = false;
        }
        this._saveDBConfig();
      })
    } else {
      // 标记，等一下写完后还要再写一次
      this._save_dbconfig_dirty = true;
    }
  }
  //#endregion
  //#region 索引
  protected _dbconfig!: DB_Config;
  protected _id_height_indexs!: Map<string, number>;
  protected _height_id_indexs!: Map<number, string>;

  /// 所有区块的的height
  protected _height_list!: HeightList
  get height_list() {
    return this._height_list.getSortedList();
  }
  /**
   * 获取最高的区块
   */
  async getMaxHeight() {
    return this._dbconfig.max_height;
  }

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
    return pageData.getItem(height)
  }
  /**
   * 获取指定范围的数据
   * @param gte start height
   * @param lte end height
   */
  @AOT_Placeholder.Wait("_db_init")
  async getByHeightRange(gte: number, lte: number) {
    const pageDataRefCache = new Map<number, CacheDataRef<T>>()
    const res: T[] = [];
    for (var i = gte; i <= lte; i += 1) {
      const height = i;
      if (!this._height_id_indexs.has(height)) {
        continue
      }
      const pageData = await this._getPageDataWithAutoCache(height, pageDataRefCache);
      res.push(pageData.get(height) as T);
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
  //#region 辅助函数
  /**
   * 自动的页面缓存获取
   * @param height
   */
  private async _getPageDataWithAutoCache(height: number, cache: Map<number, CacheDataRef<T>>) {
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
  //#endregion

  //#region 插入数据
  @AOT_Placeholder.Wait("_db_init")
  async upsertList(block_list: Iterable<T>) {
    const pageDataRefCache = new Map<number, CacheDataRef<T>>();
    let max_height = this._dbconfig.max_height;
    for (var block of block_list) {
      const pageData = await this._getPageDataWithAutoCache(block.height, pageDataRefCache);
      pageData.set(block.height, block);
      this._setIndexs(block);
      block.height > max_height && (max_height = block.height);
    }
    // 批量保存
    pageDataRefCache.forEach(pageDataRef => {
      pageDataRef.active();
      this.cacheDataPool.addCacheDataRefSaveQuene(pageDataRef);
    });
    // 尝试更新配置
    this._compareMaxHeight(max_height);
  }
  @AOT_Placeholder.Wait("_db_init")
  async upsert(block: T) {
    const pageDataRef = await this._getPageData(block.height);
    await pageDataRef.setItem(block.height, block);
    this._setIndexs(block);
    /// 保存
    pageDataRef.active();
    this.cacheDataPool.addCacheDataRefSaveQuene(pageDataRef);
    // 尝试更新配置
    block.height > this._dbconfig.max_height && this._compareMaxHeight(block.height);
  }
  private _setIndexs(block: T) {
    const old_id = this._height_id_indexs.get(block.height);
    log("set Indexs:[%o] %o => %o", block.height, old_id, block.id);
    if (typeof old_id === "string") {
      if (old_id !== block.id) {
        this._id_height_indexs.delete(old_id);
      }
    } else {
      // new height
      this._height_list.pushOne(block.height);
    }
    this._id_height_indexs.set(block.id, block.height);
    this._height_id_indexs.set(block.height, block.id);
  }
  //#endregion

  //#region 删除数据
  @AOT_Placeholder.Wait("_db_init")
  async removeByHeightList(height_list: Iterable<number>) {
    const pageDataRefCache = new Map<number, CacheDataRef<T>>();
    for (var height of height_list) {
      const pageData = await this._getPageDataWithAutoCache(height, pageDataRefCache);
      const block = pageData.get(height);
      if (!block) {
        continue;
      }
      this._deleteIndexs(block);
    }
    // 批量保存
    pageDataRefCache.forEach(pageDataRef => {
      pageDataRef.active();
      this.cacheDataPool.addCacheDataRefSaveQuene(pageDataRef);
    });
    debugger;
    // 尝试更新配置
    this._getMaxHeightFromHeightList();
  }
  private async _removeByHeight(height: number) {

    const pageDataRef = await this._getPageData(height);
    const pageData = await pageDataRef.getData();
    const block = pageData.get(height);
    if (!block) {
      return;
    }
    pageData.delete(height);
    this._deleteIndexs(block);
    /// 保存
    pageDataRef.active();
    this.cacheDataPool.addCacheDataRefSaveQuene(pageDataRef);
    // 尝试更新配置
    this._getMaxHeightFromHeightList();
  }
  removeByHeight(height: number) {
    if (!this._height_id_indexs.has(height)) {
      return;
    }
    return this._removeByHeight(height);
  }
  removeById(id: string) {
    const height = this._id_height_indexs.get(id);
    if (height === undefined) {
      return;
    }
    return this._removeByHeight(height);
  }
  private _deleteIndexs(block: T) {
    const old_id = this._height_id_indexs.get(block.height);
    log("del Indexs:[%o] %o", block.height, old_id);
    if (typeof old_id !== 'string') {
      return;
    }
    if (old_id === block.id) {
      this._id_height_indexs.delete(old_id);
    }
    this._height_id_indexs.delete(block.height);
    this._height_list.removeOne(block.height);
  }
  //#endregion

  //#region 查询数据
  private _find_task_id_acc = 0;
  private _getTaskId() {
    return ++this._find_task_id_acc;
  }
  private _qunue_query_task_list: Array<[number, BlockFilterWrapper<T>]> = [];
  /**增加查询到查询队列 */
  private _askQueryQuene(task_id: number, filter_base_wrapper: BlockFilterBaseWrapper<T>) {
    const filter_wrapper = {
      ...filter_base_wrapper,
      result: [],
      task: new PromiseOut<T[]>()
    }
    this._qunue_query_task_list.push([task_id, filter_wrapper]);
    if (!this.__curent_query_task) {
      this.__doQuery();
    }
    return filter_wrapper.task.promise;
  }

  private __curent_query_task?: QueryTask<T>
  /**执行查询任务 */
  private __doQuery() {
    const do_query_time_log = debug("blockchain-db:core:do-query");
    const do_query_loop_log = debug("blockchain-db:core:do-query:loop");

    const filter_wrapper_map = new Map<number, BlockFilterWrapper<T>>();
    this.__curent_query_task = {
      // cur_page_index: 0,
      filter_wrapper_map,
      task: Promise.resolve(/*使用微任务对任务进行自动合并 */).then(async () => {
        do_query_time_log("start query");
        // 生成任务表
        this._qunue_query_task_list.forEach((query_task) => {
          filter_wrapper_map.set(query_task[0], query_task[1]);
        });
        this._qunue_query_task_list = [];

        const { _dbconfig } = this;
        for (var i = 0; i < _dbconfig.max_height; i += _dbconfig.page_size) {
          const page_index = (i / _dbconfig.page_size) | 0;
          const pageDataRef = this.cacheDataPool.getCacheDataRef(page_index);
          const pageData = await pageDataRef.getData();
          if (pageData.size == 0) {
            do_query_loop_log("查询到 %o 页，无数据", page_index);
            continue;
          }
          do_query_loop_log("查询到 %o 页，将执行 %o 个查询任务", page_index, filter_wrapper_map.size);
          for (var item of pageData.values()) {
            // filter_wrapper_map的循环放内部，因为随时有可能需要进行移除
            filter_wrapper_map.forEach((filter_wrapper, task_id) => {
              try {
                if (filter_wrapper.filter(item)) {
                  filter_wrapper.result.push(item);
                  if (filter_wrapper.result.length >= filter_wrapper.skip + filter_wrapper.limit) {
                    do_query_loop_log("任务 %s 完成，过滤到 %o 条数据", task_id, filter_wrapper.result.length);
                    filter_wrapper_map.delete(task_id);
                    filter_wrapper.task.resolve(filter_wrapper.result.slice(filter_wrapper.skip, filter_wrapper.skip + filter_wrapper.limit));
                  }
                }
              } catch (err) {
                do_query_loop_log("任务 %s 失败，%O", task_id, err);
                filter_wrapper_map.delete(task_id);
                filter_wrapper.task.reject(err);
              }
            });
            if (filter_wrapper_map.size === 0) {
              break;
            }
          };
          if (filter_wrapper_map.size === 0) {
            break;
          }
        }
        do_query_time_log("end query");
      }).then(() => {
        this.__curent_query_task = undefined;
        // 如果队列中有任务，继续执行
        if (this._qunue_query_task_list.length) {
          this.__doQuery();
        }
      }),
    };
  }
  /**查询一个 */
  async findOne(filter: BlockFilterFunction<T>) {
    const task_id = this._getTaskId();
    const result = await this._askQueryQuene(task_id, {
      filter,
      limit: 1,
      skip: 0
    });
    return result[0];
  }
  /**查询数组，不支持排序查询，默认从高度1开始查询 */
  async findList(filter: BlockFilterFunction<T>, limit = Infinity, skip = 0) {
    const task_id = this._getTaskId();
    const result = await this._askQueryQuene(task_id, {
      filter,
      limit,
      skip
    });
    return result;
  }
  //#endregion
  //#region 缓存管理
  cacheDataPool = new CacheDataPool<T>({
    getPageKey: this.DB_PAGE_KEY.bind(this),
    max_cache_page_num: 10,
    cg_interval: 1e3,
    auto_cg_hot_line: 0.2,
  });

  private _readDataFromDB(page_index: number) {
    const page_key = this.DB_PAGE_KEY(page_index);
    return IDB_VK.get<CacheBlockList<T> | undefined>(page_key);
  }
  //#endregion

  /**销毁数据库 */
  async destroy() {
    await this.cacheDataPool.CG();
    this._id_height_indexs.clear();
    this._height_id_indexs.clear();
    this._height_list.destroiy();
    delete this._id_height_indexs;
    delete this._height_id_indexs;
    delete this._height_list;
  }
}
