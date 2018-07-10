import { Storage } from "@ionic/storage";
import { Device } from "@ionic-native/device";
import { Injectable } from "@angular/core";
import { Http, Headers, RequestOptionsArgs } from "@angular/http";
import { TranslateService } from "@ngx-translate/core";
import EventEmitter from "eventemitter3";

import { AppUrl } from "../app-setting/app-setting";

import { AppSettingProvider } from "../app-setting/app-setting";
import {
  DbCacheProvider,
  installApiCache,
  HTTP_Method,
} from "../db-cache/db-cache";
import { tryRegisterGlobal } from "../../bnqkl-framework/FLP_Tool";
import io from "socket.io-client";

import "whatwg-fetch"; // 导入标准的fetch接口，确保ifmchain-ibt库的正常执行

export class ServerResError extends Error {
  static translateAndParseErrorMessage(message, code?, details?) {
    const err_translated_msg = (window[
      "translate"
    ] as TranslateService).instant(message);
    return ServerResError.parseErrorMessage(code, message, details);
  }
  static getI18nError(message, code?, details?) {
    const err_translated_msg = (window[
      "translate"
    ] as TranslateService).instant(message);
    const err = ServerResError.parseErrorMessage(code, message, details);
    return this.removeErrorCurrentStackLine(err);
  }
  static removeErrorCurrentStackLine(err: Error) {
    err.stack = (err.stack || "").replace(/\n[\w\W]+?\n/, "\n");
    return err;
  }
  static parseErrorMessage(
    code: string | undefined,
    message: string,
    details?,
  ) {
    const CODE_LIST = code ? [code + ""] : [];
    var MESSAGE = message;
    while (MESSAGE.indexOf("500 - ") === 0) {
      const rest_msg = MESSAGE.substr(6);
      try {
        const rest_err = JSON.parse(rest_msg);
        if (rest_err.error) {
          CODE_LIST.push(rest_err.error.code);
          MESSAGE = rest_err.error.message;
        } else {
          break;
        }
      } catch (err) {}
    }
    const err = new ServerResError(CODE_LIST, MESSAGE, details);
    return this.removeErrorCurrentStackLine(err);
  }
  constructor(code_list: string[], message: string, public details?: any) {
    super(code_list.map(c => `<small>${c}</small>`).join("") + message);
    this.MESSAGE = String(message);
    this.CODE_LIST = code_list;
    this.stack += "\t\n" + code_list.join("\t\n");
  }
  CODE_LIST: string[];
  get CODE(): string {
    return this.CODE_LIST[0] || "";
  }
  MESSAGE: string;
}
export type CommonResponseData<T> = {
  error?: {
    code: string;
    message: string;
  };
  result: T;
};
@Injectable()
export class AppFetchProvider extends EventEmitter {
  private _onLine = navigator.onLine;
  get onLine() {
    return this._onLine;
  }
  ioRequest<T>(path, query) {
    return new Promise<T>((resolve, reject) => {
      this.io.emit(path, query, res => {
        if (res.success) {
          resolve(res);
        } else {
          reject(res);
        }
      });
    });
  }
  ServerResError = ServerResError;
  get io_url_path() {
    return AppSettingProvider.SERVER_URL + "/web";
  }
  private _io?: SocketIOClient.Socket;
  get io() {
    if (!this._io) {
      this._io = io(this.io_url_path, {
        transports: ["websocket"],
      });
      this._io.on("connect", () => {
        this._onLine = true;
        this.emit("ononline");
      });
      this._io.on("disconnect", () => {
        this._onLine = false;
        this.emit("onoffline");
      });
    }
    return this._io;
  }
  wsHttp: any = {};
  async ioEmitAsync<T>(path, body) {
    return this._handlePromise(
      new Promise<T>((resolve, reject) => {
        this.io.emit(path, body, res => {
          // resolve(res);
          res.success ? resolve(res) : reject(res);
        });
      }),
    );
  }
  // private _user_token!: string;

  constructor(
    public http: Http,
    public appSetting: AppSettingProvider,
    public storage: Storage,
    public translateService: TranslateService,
    public dbCache: DbCacheProvider,
    public device: Device,
  ) {
    super();
    tryRegisterGlobal("FETCH", this);
    // 向服务端发送安全的设备信息进行统计
    this.io.emit("app-start", {
      version: AppSettingProvider.APP_VERSION,
      ...device,
    });
    //
    const wsHttpReq = (method, url, query) => {
      return this.ioRequest(
        `${method}${url
          .replace(AppUrl.SERVER_URL, "")
          .replace(AppUrl.BACKEND_VERSION, "")}`,
        query,
      );
    };
    ["get", "delete", "head", "options"].forEach(method => {
      this.wsHttp[method] = (url: string, options) => {
        return wsHttpReq(method, url, options.search);
      };
    });
    ["post", "put", "patch"].forEach(method => {
      this.wsHttp[method] = (url: string, body, options) => {
        return wsHttpReq(method, url, body);
      };
    });
  }

  private _handleResThen(res) {
    const data = res.json instanceof Function ? res.json() : res;

    if (data.success) {
      return data;
    } else {
      //返回的错误在reject中统一处理，翻译后返回
      return this._handleResCatch(res);
    }
  }
  private _handleResCatch(res) {
    const data = res.json instanceof Function ? res.json() : res;
    const error = data.message ? data : data.error;
    if (error) {
      let { message: err_message, code: error_code, ...details } = error;
      if (typeof error === "string") {
        err_message = error;
      }
      throw ServerResError.translateAndParseErrorMessage(
        err_message,
        error_code,
        details,
      );
    } else {
      if (data) {
        if (
          data.constructor.name === "ProgressEvent" ||
          data.constructor.name === "XMLHttpRequestProgressEvent"
        ) {
          throw new Error("网络异常");
        }
        throw new Error(data);
      } else {
        throw new Error("未知异常");
      }
    }
  }
  private _catchData() {}
  private _handlePromise<T>(promise: Promise<T>) {
    return promise
      .catch(this._handleResCatch.bind(this))
      .then(this._handleResThen.bind(this));
  }
  private _handleUrlAndOptions(
    url: string,
    options: RequestOptionsArgs = {},
    without_token?: boolean,
  ) {
    if (!without_token) {
      const headers = options.headers || (options.headers = new Headers());
    }
    const params = options.params as { [key: string]: any };
    if (params && params.constructor === Object) {
      delete options.params;
      for (var key in params) {
        const val = params[key];
        url = url.replace(new RegExp(`\:${key}`, "g"), val);
      }
      console.log(url);
    }
    return { url, options };
  }
  private async _requestWithApiService<T>(
    method: HTTP_Method,
    url: string,
    body: any,
    options: RequestOptionsArgs = {},
    without_token?: boolean,
    timeout_ms = this.timeout_ms,
  ) {
    if (!this.force_network) {
      // 先查找自定义API接口
      const custom_api_config:
        | installApiCache<T>
        | undefined = this.dbCache.cache_api_map.get(
        `${method}:${AppUrl.getPathName(url)}`,
      );
      if (custom_api_config) {
        const api_service = custom_api_config;
        const db = this.dbCache.dbMap.get(api_service.dbname);
        if (db) {
          const requestOptions = {
            method,
            url,
            reqOptions: options,
            body,
          };
          const { reqs, cache } = await api_service.beforeService(
            db,
            requestOptions,
          );
          if (reqs.length) {
            const mix_data = await Promise.all(
              reqs.map(async req => {
                const { method, url, reqOptions, body } = req;
                return {
                  ...req,
                  result: await this._request(
                    method,
                    url.toString(),
                    body,
                    reqOptions,
                    without_token,
                    timeout_ms,
                  ),
                };
              }),
            )
              .then(res_list => api_service.afterService(res_list))
              .catch(err => {
                console.warn("联网数据不可用", err);
              });
            return api_service.dbHandle(db, mix_data, cache, requestOptions);
          } else {
            // console.log(
            //   "%cOFFLINE-SERVICE",
            //   "color:#009688;",
            //   api_service.dbname,
            //   api_service.url.path,
            //   options,
            //   cache,
            // );
            return cache;
          }
        }
      }
    }
    return this._request<T>(
      method,
      url,
      body,
      options,
      without_token,
      timeout_ms,
    );
  }
  private _request<T>(
    method: string,
    url: string,
    body: any,
    options: RequestOptionsArgs = {},
    without_token?: boolean,
    timeout_ms = this.timeout_ms,
  ) {
    const reqInfo = this._handleUrlAndOptions(url, options, without_token);
    const httpAdapter =
      url.indexOf(AppUrl.SERVER_URL) !== -1 ? this.wsHttp : this.http;

    var req;
    switch (method) {
      case "get":
      case "delete":
      case "head":
      case "options":
        req = httpAdapter[method](reqInfo.url, reqInfo.options);
        break;
      case "post":
      case "put":
      case "patch":
        req = httpAdapter[method](reqInfo.url, body, reqInfo.options);
        break;
    }
    // debugger;
    var req_promise = req.then instanceof Function ? req : req.toPromise();
    if (
      httpAdapter === this.wsHttp /*websocket默认提供5s的请求超时*/ ||
      (isFinite(timeout_ms) && timeout_ms > 0)
    ) {
      req_promise = Promise.race([
        req_promise,
        new Promise((resolve, reject) =>
          setTimeout(() => {
            // TOOO: 国际化
            reject(new Error("TIME OUT"));
          }, timeout_ms || 5000),
        ),
      ]);
    }
    return this._handlePromise(req_promise);
  }
  get<T>(
    url: string | AppUrl,
    options: RequestOptionsArgs = {},
    no_token?: boolean,
  ): Promise<T> {
    return this._requestWithApiService(
      "get",
      url.toString(),
      void 0,
      options,
      no_token,
    );
  }
  post<T>(
    url: string | AppUrl,
    body: any = {},
    options: RequestOptionsArgs = {},
    no_token?: boolean,
  ): Promise<T> {
    return this._requestWithApiService(
      "post",
      url.toString(),
      body,
      options,
      no_token,
    );
  }
  put<T>(
    url: string | AppUrl,
    body: any = {},
    options: RequestOptionsArgs = {},
    no_token?: boolean,
  ): Promise<T> {
    return this._requestWithApiService(
      "put",
      url.toString(),
      body,
      options,
      no_token,
    );
  }
  delete<T>(
    url: string | AppUrl,
    options: RequestOptionsArgs = {},
    no_token?: boolean,
  ): Promise<T> {
    return this._requestWithApiService(
      "delete",
      url.toString(),
      void 0,
      options,
      no_token,
    );
  }

  private _timeout_ms;
  private get timeout_ms() {
    const res = this._timeout_ms;
    // 一次性取值，取完就不用了
    this._timeout_ms = undefined;
    return res;
  }
  timeout(timeout_ms?: number): this {
    this._timeout_ms = timeout_ms;
    return this;
  }

  private _force_network?: boolean;
  private get force_network() {
    const res = this._force_network;
    // 一次性取值，取完就不用了
    this._force_network = undefined;
    return res;
  }
  forceNetwork(force_network?: boolean): this {
    this._force_network = force_network;
    return this;
  }

  private _catch_first;
  /**优先获取缓存*/
  private get catch_first() {
    const res = this._catch_first;
    // 一次性取值，取完就不用了
    this._catch_first = undefined;
    return res;
  }
  private tryGetCatch(catch_first?: boolean): AppFetchProvider {
    this._catch_first = catch_first;
    return this;
  }
  private _catch_first_base_on_type = TryGetCatchBaseOn.Height;

  tryGetCatchBaseOnHeight() {
    this.tryGetCatch(true);
    this._catch_first_base_on_type = TryGetCatchBaseOn.Height;
  }
  tryGetCatchBaseOnRound() {
    this.tryGetCatch(true);
    this._catch_first_base_on_type = TryGetCatchBaseOn.Round;
  }
}
export enum TryGetCatchBaseOn {
  Height,
  Round,
}
