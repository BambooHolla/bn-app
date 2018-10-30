import { BlockModel } from "../../src/providers/block-service/block.types";
import * as IDB_VK from "idb-keyval";
import { PromisePro, PromiseOut } from "../../src/bnqkl-framework/PromiseExtends";

export type CacheBlockList = Array<BlockModel | undefined>;
/**
 * 缓存池子
 */
export class CacheDataPool {
  cacheDataRefMap = new Map<number, CacheDataRef>();
  /**检查CG的定时器间隔 */
  public CG_INTERVAL = 1e3;
  /**默认最多缓存N个分页的数据 */
  public MAX_CACHE_PAGE_NUM = 10;
  /**访问活跃度低于这个阈值自动释放 */
  public AUTO_CG_HOT_LINE = 0.2;
  constructor(opts?: {
    getPageKey?: (page_index: number) => string,
    max_cache_page_num?: number
    cg_interval?: number
    auto_cg_hot_line?: number
  }) {
    if (opts) {
      if (opts.getPageKey) {
        this.getPageKey = opts.getPageKey;
      }
      if (typeof opts.max_cache_page_num === 'number') {
        this.MAX_CACHE_PAGE_NUM = opts.max_cache_page_num;
      }
      if (typeof opts.cg_interval === 'number') {
        this.CG_INTERVAL = opts.cg_interval;
      }
      if (typeof opts.auto_cg_hot_line === 'number') {
        this.AUTO_CG_HOT_LINE = opts.auto_cg_hot_line;
      }
    }
  }
  getPageKey(page_index: number) {
    return '' + page_index;
  }
  getCacheDataRef(page_index: number) {
    let cacheDataRef = this.cacheDataRefMap.get(page_index);
    if (!cacheDataRef) {
      cacheDataRef = new CacheDataRef(
        page_index,
        this.getPageKey(page_index),
        this,
        {
          auto_cg_hot_line: this.AUTO_CG_HOT_LINE,
          unref: () => {
            this.cacheDataRefMap.delete(page_index);
          }
        });
      this.cacheDataRefMap.set(page_index, cacheDataRef);
    }
    return cacheDataRef;
  }
  /* 回收数据，忽略写入 */
  async CG(give_up_writein?: boolean) {
    await Promise.all([...this.cacheDataRefMap.values()].map(async ref => {
      const save_ticket = ref.getSaveTicket();
      if (save_ticket) {
        await save_ticket.save_task;
      }
      ref.unref();
      if (typeof ref.cg_ti === 'number') {
        clearTimeout(ref.cg_ti)
      }
    }));
  }

  save_ticket_set = new Set<CacheDataSaveTicket>();
  async addSaveQuene(page_index: number) {
    this.save_ticket_set.add((await this.getCacheDataRef(page_index)).generateSaveTicket());
    this._runSaveTicket();
  }
  private _current_runing_save_ticket?: CacheDataSaveTicket
  private _current_runing_save_task?: Promise<void>
  private _runSaveTicket() {
    if (this._current_runing_save_task) {
      return;
    }
    const ticket = this.save_ticket_set.values().next().value;
    if (ticket) {
      this._current_runing_save_ticket = ticket;
      this._current_runing_save_task = ticket.exector().then(() => {
        this.save_ticket_set.delete(ticket);
        this._current_runing_save_ticket = undefined;
        this._current_runing_save_task = undefined;
        this._runSaveTicket();
      });
    }
  }
}
/**
 * 缓存的引用管理
 */
export class CacheDataRef {
  constructor(
    public page_index: number,
    public page_key: string,
    public cacheDataPool: CacheDataPool,
    opts?: {
      ref?: typeof CacheDataRef.prototype.ref;
      unref?: typeof CacheDataRef.prototype.unref;
      auto_cg_hot_line?: number
    }
  ) {
    if (opts) {
      if (opts.ref) {
        this.ref = opts.ref
      }
      if (opts.unref) {
        this.unref = opts.unref
      }
      if (typeof opts.auto_cg_hot_line === "number") {
        this.AUTO_CG_HOT_LINE = opts.auto_cg_hot_line;
      }
    }
  }
  ref() { }
  unref() { }
  /**Lastest visited time */
  lvt = 0;
  /**访问活跃度 */
  hot = 0;
  /**访问活跃度低于这个阈值自动释放 */
  AUTO_CG_HOT_LINE = 0.2;
  /**检查CG的定时器间隔 */
  CG_INTERVAL = 1e3;
  /**数据请求任务 */
  data_req?: PromisePro<CacheBlockList>
  /**请求完成的数据对象 */
  private _actived_data?: CacheBlockList

  /**CG定时器的返回引用 */
  cg_ti?: number
  /**激活网络 */
  active() {
    if (!this._actived_data) {
      return this._actived_data;
    }
    if (!this.data_req) {
      this.data_req = PromisePro.fromPromise(this._readDataFromDB().then(data => {
        this._actived_data = data || [];
        this.ref();// 激发引用

        if (data) {
          // 进入CG回收状态
          const check_hot = () => {
            this.hot /= 2;
            if (this.__calcCacheCanKeep()) {
              this.cg_ti = setTimeout(check_hot, this.CG_INTERVAL);
            } else {
              this.cg_ti = undefined;
              this.unref();// 释放引用
            }
          }
          this.cg_ti = setTimeout(check_hot, this.CG_INTERVAL);
        }
        return this._actived_data;
      }));
    }
  }
  getData() {
    if (!this.data_req) {
      throw new Error("cacheDataRef should be active.");
    }
    return this._actived_data || this.data_req.promise;
  }
  async getItem(index: number) {
    const data = await this.getData();
    return data[index];
  }
  /**计算缓存是否可悲释放 */
  private __calcCacheCanKeep() {
    const { cacheDataRefMap, MAX_CACHE_PAGE_NUM } = this.cacheDataPool;
    if (cacheDataRefMap.size > MAX_CACHE_PAGE_NUM) {
      const hot_list = [...cacheDataRefMap.values()].map(c => c.hot).sort();
      return this.hot >= hot_list[hot_list.length - MAX_CACHE_PAGE_NUM];
    }
    // 低于设定的最低阈值，进行数据回收
    return this.hot >= this.AUTO_CG_HOT_LINE;
  }
  /**请求数据 */
  private _readDataFromDB() {
    return IDB_VK.get<CacheBlockList | undefined>(this.page_key);
  }
  /**保存数据 */
  private _writeDataToDB() {
    return IDB_VK.set(this.page_key, this._actived_data);
  }
  private _save_ticket?: CacheDataSaveTicket;
  getSaveTicket() {
    return this._save_ticket;
  }
  generateSaveTicket() {
    if (!this._save_ticket) {
      const save_ticket = {
        save_task: new PromiseOut<void>(),
        runed: false,
        exector: () => {
          if (!save_ticket.runed) {
            save_ticket.runed = true;
            this._writeDataToDB()
              .then(save_ticket.save_task.resolve)
              .catch(save_ticket.save_task.reject);
          }
          return save_ticket.save_task.promise;
        }
      }
      this._save_ticket = save_ticket;
    }
    return this._save_ticket;
  }
}

type CacheDataSaveTicket = {
  exector: () => Promise<void>
  save_task: PromiseOut<void>
  runed: boolean
}
