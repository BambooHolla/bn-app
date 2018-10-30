export type PromiseType<T extends Promise<any>> = T extends Promise<infer R>
  ? R
  : any;
export type PromiseReturnType<T extends (...args: any[]) => Promise<any>> =
  PromiseType<ReturnType<T>>;

/**
 * 将resolve和reject暴露出来
 *
 * @export
 * @class PromiseOut
 * @template T
 */
export class PromiseOut<T> {
  resolve!: (value?: T | PromiseLike<T> | undefined) => void;
  reject!: (reason?: any) => void;
  promise: Promise<T>;
  constructor(promiseCon: PromiseConstructor = Promise) {
    this.promise = new promiseCon<T>((_resolve, _reject) => {
      this.resolve = _resolve;
      this.reject = _reject;
    });
  }
}
