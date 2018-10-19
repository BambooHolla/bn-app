import EventEmitter from "eventemitter3";
import { PromiseOut } from './lib/PromiseOut';
export * from './lib/PromiseOut';
/**
 * Why AbortError
 * 为了和其它的Error进行区分
 * 一般的Error是来自代码的异常、数据服务的异常
 * 但是AbortError是来自用户的操作，主动取消某个执行中的动作
 * 一般来说如果是AbortError，我们可以跳过不处理，至少不需要将这种异常展示给用户
 *
 * @export
 * @class AbortError
 * @extends {Error}
 */
export class AbortError extends Error {
  ABORT_ERROR_FLAG = true;
}

export class PromisePro<T> extends PromiseOut<T> {
  constructor(promiseCon?: PromiseConstructor) {
    super(promiseCon);
  }
  is_done = false;
  abort_error?: AbortError;
  abort(abort_message = "Abort") {
    if (this.is_done) {
      return;
    }
    this.reject((this.abort_error = new AbortError(abort_message)));
    this._tryEmit("abort", this.abort_error, this);
  }
  private _event?: EventEmitter;
  get event() {
    if (!this._event) {
      this._event = new EventEmitter();
    }
    return this._event;
  }
  private _tryEmit(eventname: string, ...args: any[]) {
    if (this._event) {
      this._event.emit(eventname, ...args);
    }
  }
  onAbort(cb: () => void) {
    this.event.on("abort", cb);
  }
  follow(from_promise: Promise<T>) {
    from_promise.then(this.resolve).catch(this.reject);
    return this.promise;
  }
  static fromPromise<T>(promise: Promise<T>) {
    const res = new PromisePro();
    if (promise instanceof DelayPromise) {
      promise.delayThen(res.resolve);
      promise.delayCatch(res.reject);
    } else {
      promise.then(res.resolve);
      promise.catch(res.reject);
    }
    return res;
  }
}
export function autoAbort(
  target,
  name: string,
  descriptor: PropertyDescriptor
) {
  const fun = descriptor.value;
  let _lock: PromisePro<any> | undefined;
  descriptor.value = function (...args) {
    if (_lock) {
      _lock.abort();
      _lock = undefined;
    }
    const res = (_lock = fun.apply(this, args));
    res.promise.then(() => {
      _lock = undefined;
    });
    return res;
  };
}

/**
 * 在调用.then或者.catch的时候才会执行启动函数
 */
export class DelayPromise<T> extends Promise<T> {
  constructor(
    executor: (
      resolve: (value?: T | PromiseLike<T>) => void,
      reject: (reason?: any) => void
    ) => void
  ) {
    var _resolve: any;
    var _reject: any;
    super((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    });
    var is_runed = false;
    const run_executor = () => {
      if (!is_runed) {
        executor(_resolve, _reject);
        is_runed = true;
      }
    };

    this.then = (onfulfilled?: any, onrejected?: any) => {
      run_executor();
      return this.delayThen(onfulfilled, onrejected) as any;
    };
    this.catch = (onrejected?: any) => {
      run_executor();
      return this.delayCatch(onrejected) as any;
    };
  }
  delayThen(onfulfilled?: any, onrejected?: any) {
    return super.then(onfulfilled, onrejected);
  }
  delayCatch(onrejected?: any) {
    return super.catch(onrejected);
  }
}

export const sleep = (ms: number) => {
  return new Promise(cb => setTimeout(cb, ms));
};

export class ParallelPool<T = any> {
  constructor(public max_parallel_num = 2) { }
  private _tasks: Promise<
    | {
      assets: T;
      finally_rm: () => void;
    }
    | {
      error: any;
      finally_rm: () => void;
    }
    >[] = [];
  private _tasks_executor: (() => Promise<T>)[] = [];
  addTaskExecutor(
    executor: () => Promise<T>,
    opts: { auto_run: true }
  ): ReturnType<typeof ParallelPool.prototype.waitNext>;
  addTaskExecutor(
    executor: () => Promise<T>,
    opts?: { auto_run?: false }
  ): undefined;
  addTaskExecutor(
    executor: () => Promise<T>,
    opts: { auto_run?: boolean } = {}
  ) {
    this._tasks_executor.push(executor);
    if (opts.auto_run) {
      return this.waitNext();
    }
  }
  get is_done() {
    return this._tasks.length === 0 && this._tasks_executor.length === 0;
  }
  get has_next() {
    return this._tasks.length > 0 || this._tasks_executor.length > 0;
  }
  get is_full() {
    return this._tasks.length >= this.max_parallel_num;
  }
  async waitNext() {
    if (this.has_next) {
      while (!this.is_full) {
        const executor = this._tasks_executor.shift();
        if (!executor) {
          break;
        }

        const task = executor();
        const task_auto_rm = task /*finally*/
          .then(res => {
            return { assets: res, finally_rm };
          })
          .catch(err => {
            return { error: err, finally_rm };
          });
        const finally_rm = () => {
          const i = this._tasks.indexOf(task_auto_rm);
          if (i !== -1) {
            this._tasks.splice(i, 1);
          }
        };
        this._tasks.push(task_auto_rm);
      }
      const result = await Promise.race(this._tasks);
      const { finally_rm, ...res } = result;
      finally_rm(); // 移除这个要返回的
      return res;
    }
  }
  async *yieldResults(opts: {
    ignore_error?: boolean;
    skip_when_no_full?: boolean; // 在无法填满并行池的情况下，跳过这次执行
    yield_num?: number;
  }) {
    if (
      opts.skip_when_no_full &&
      this._tasks.length + this._tasks_executor.length < this.max_parallel_num
    ) {
      return;
    }
    let yield_num =
      typeof opts.yield_num === "number" ? opts.yield_num | 0 : Infinity;
    while (this.has_next) {
      if (yield_num <= 0) {
        break;
      }
      yield_num -= 1;
      const task_result = await this.waitNext();
      if (task_result) {
        if ("assets" in task_result) {
          yield task_result.assets;
        } else if (opts.ignore_error) {
          // console.error(task_result.error);
          throw task_result.error;
        }
      }
    }
  }
}
