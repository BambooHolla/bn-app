import * as IDB_VK from "idb-keyval";
import { PromisePro, PromiseOut } from "../../src/bnqkl-framework/PromiseExtends";
import { BlockBaseModel, CacheBlockList } from "./const";
// import { EventEmitter } from 'eventemitter3'

import debug from "debug";
const log = debug("blockchain-db:cache-data-ref");

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
      log("创建缓存对象: %o", page_index);
      cacheDataRef = new CacheDataRef(
        page_index,
        this.getPageKey(page_index),
        this,
        {
          auto_cg_hot_line: this.AUTO_CG_HOT_LINE,
          unref: () => {
            log("释放缓存对象: %o", page_index);
            this.cacheDataRefMap.delete(page_index);
          }
        });
      this.cacheDataRefMap.set(page_index, cacheDataRef);
    }
    cacheDataRef.active();
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
  // async addSaveQuene(page_index: number) {
  //   this.save_ticket_set.add((await this.getCacheDataRef(page_index)).generateSaveTicket());
  //   this._runSaveTicket();
  // }
  async addCacheDataRefSaveQuene(cache_data_ref: CacheDataRef) {
    this.save_ticket_set.add(cache_data_ref.generateSaveTicket());
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
  async active() {
    if (this.data_req) {
      const NOW = Date.now();
      this.hot += Math.max(1, Math.min(1000 / (NOW - this.lvt), 512));
      this.lvt = NOW;
      log("cacheDataRef: %o hot激发至 %o", this.page_index, this.hot);
    } else {
      this.data_req = PromisePro.fromPromise(this._readDataFromDB().then(data => {
        this._actived_data = data || new Map();
        this.ref();// 激发引用
        return this._actived_data;
      }));
      await this.data_req;
    }
    this._activeToCG();
  }
  private _activeToCG() {
    /// 空数据，停止回收的任务
    if (this._actived_data && this._actived_data.size === 0) {
      if (this.cg_ti !== undefined) {
        clearTimeout(this.cg_ti);
        this.cg_ti = undefined;
      }
      return;
    }

    // 已经有在回收任务中了。
    if (this.cg_ti !== undefined) {
      return;
    }
    // 进入CG回收状态
    const check_hot = () => {
      this.hot /= 2;
      log(`cacheDataRef: %o hot衰退至 %o`, this.page_index, this.hot);
      if (this.__calcCacheCanKeep()) {
        this.cg_ti = setTimeout(check_hot, this.CG_INTERVAL);
      } else {
        this.cg_ti = undefined;
        this.unref();// 释放引用
      }
    }
    this.cg_ti = setTimeout(check_hot, this.CG_INTERVAL);
  }

  getData() {
    if (!this.data_req) {
      throw new Error("cacheDataRef should be active.");
    }
    return this._actived_data || this.data_req.promise;
  }
  async getItem(index: number) {
    const data = await this.getData();
    return data.get(index);
  }
  async setItem(index: number, block: BlockBaseModel) {
    const data = await this.getData();
    data.set(index, block);
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
    log("write Data To DB: %s", this.page_key);
    return IDB_VK.set(this.page_key, this._actived_data).then(() => log("writed Data To DB: %s", this.page_key));
  }
  private _save_ticket?: CacheDataSaveTicket;
  getSaveTicket() {
    return this._save_ticket;
  }
  generateSaveTicket() {
    const { data_req } = this;
    if (!data_req) {
      throw new Error("cacheDataRef should be active.");
    }
    if (!this._save_ticket || this._save_ticket.runed) {
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
      save_ticket.save_task.promise.then(() => {
        if (this._save_ticket === save_ticket) {
          this._save_ticket = undefined;
        }
      });
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
