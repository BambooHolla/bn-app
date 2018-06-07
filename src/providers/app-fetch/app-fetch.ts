import { Storage } from "@ionic/storage";
import { Injectable } from "@angular/core";
import { Http, Headers, RequestOptionsArgs } from "@angular/http";
import { TranslateService } from "@ngx-translate/core";

import { AppUrl } from "../app-setting/app-setting";

import { AppSettingProvider } from "../app-setting/app-setting";
import {
  DbCacheProvider,
  installApiCache,
  HTTP_Method,
} from "../db-cache/db-cache";
import { tryRegisterGlobal } from "../../bnqkl-framework/FLP_Tool";

import "whatwg-fetch"; // 导入标准的fetch接口，确保ifmchain-ibt库的正常执行

export class ServerResError extends Error {
  static translateAndParseErrorMessage(message, code?) {
    const err_translated_msg = (window[
      "translate"
    ] as TranslateService).instant(message);
    return code
      ? ServerResError.parseErrorMessage(code, message)
      : new Error(err_translated_msg);
  }
  static getI18nError(message, code?) {
    const err_translated_msg = (window[
      "translate"
    ] as TranslateService).instant(message);
    const err = code
      ? ServerResError.parseErrorMessage(code, message)
      : new Error(err_translated_msg);
    return this.removeErrorCurrentStackLine(err);
  }
  static removeErrorCurrentStackLine(err: Error) {
    err.stack = (err.stack || "").replace(/\n[\w\W]+?\n/, "\n");
    return err;
  }
  static parseErrorMessage(code, message) {
    const CODE_LIST = [code + ""];
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
    const err = new ServerResError(CODE_LIST, MESSAGE);
    return this.removeErrorCurrentStackLine(err);
  }
  constructor(code_list: string[], message: string) {
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
export class AppFetchProvider {
  ServerResError = ServerResError;
  // private _user_token!: string;

  constructor(
    public http: Http,
    public appSetting: AppSettingProvider,
    public storage: Storage,
    public translateService: TranslateService,
    public dbCache: DbCacheProvider,
  ) {
    console.log("Hello AppFetchProvider Provider");
    tryRegisterGlobal("FETCH", this);
  }

  private _handleResThen(res) {
    const data = res.json();

    if (data.success) {
      return data;
    } else {
      //返回的错误在reject中统一处理，翻译后返回
      return this._handleResCatch(res);
    }
  }
  private _handleResCatch(res) {
    const data = res.json();
    const error = data.error;
    if (error) {
      // debugger;
      const err_message = data.error && data.error.message;
      if (err_message) {
        throw ServerResError.translateAndParseErrorMessage(
          err_message,
          error.code,
        );
      } else {
        throw new Error(data.error);
      }
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
  private _handlePromise(
    promise: Promise<any>,
    // auto_cache: boolean,
    catch_key?: string,
  ) {
    if (catch_key) {
      promise = promise
        .then(response => {
          try {
            this.storage.set(catch_key, JSON.stringify(response.json()));
          } catch (err) {
            console.warn("缓冲区缓存数据出错", err);
          }
          return response;
        })
        .catch(async response => {
          const cache_data_json = await this.storage.get(catch_key);
          var cache_data;
          if (cache_data_json) {
            try {
              cache_data = JSON.parse(cache_data_json);
              if (!cache_data) {
                throw null;
              }
              try {
                this._handleResCatch(response);
              } catch (err) {
                cache_data.__source_err__ = err;
              }
              response.json = () => cache_data;
              return response;
            } catch (err) {
              console.error(
                "缓冲区数据异常：\n",
                catch_key,
                "\n",
                cache_data_json,
                "\n",
                err,
              );
            }
          }
          return Promise.reject(response);
        });
    }
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
    auto_cache = this.auto_cache,
    timeout_ms = this.timeout_ms,
  ) {
    // 先查找自定义API接口
    const custom_api_config:
      | installApiCache<T>
      | undefined = this.dbCache.cache_api_map.get(
      `${method}:${new URL(url).pathname}`,
    );
    if (custom_api_config) {
      const api_service = custom_api_config;
      const db = this.dbCache.dbMap.get(api_service.dbname);
      if (db) {
        const { reqs, cache } = await api_service.beforeService(db, {
          method,
          url,
          reqOptions: options,
          body,
        });
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
                  auto_cache,
                  timeout_ms,
                ),
              };
            }),
          ).then(res_list => api_service.afterService(res_list));
          return api_service.dbHandle(db, mix_data, cache);
        } else {
          return cache;
        }
      }
    }
    return this._request<T>(
      method,
      url,
      body,
      options,
      without_token,
      auto_cache,
      timeout_ms,
    );
  }
  private _request<T>(
    method: string,
    url: string,
    body: any,
    options: RequestOptionsArgs = {},
    without_token?: boolean,
    auto_cache = this.auto_cache,
    timeout_ms = this.timeout_ms,
  ) {
    // // 获取外部的默认值并自动重置，一定要触发getter
    // const default_auto_cache = this.auto_cache;
    // if (auto_cache === undefined) {
    //   auto_cache = default_auto_cache;
    // }
    // const default_timeout_ms = this.timeout_ms;
    // if (timeout_ms === undefined) {
    //   timeout_ms = default_timeout_ms;
    // }
    let catch_key: string = "";
    if (auto_cache) {
      const url_info = new URL(url);
      catch_key =
        `[${method}]${url_info.pathname}` +
        `【PARAMS：${JSON.stringify(options.params)}】` +
        `【SEARCH：${JSON.stringify(options.search)}】`;
    }
    const reqInfo = this._handleUrlAndOptions(url, options, without_token);
    var req;
    switch (method) {
      case "get":
      case "delete":
      case "head":
      case "options":
        req = this.http[method](reqInfo.url, reqInfo.options);
        break;
      case "post":
      case "put":
      case "patch":
        req = this.http[method](reqInfo.url, body, reqInfo.options);
        break;
    }
    var req_promise = req.toPromise();
    if (isFinite(timeout_ms) && timeout_ms > 0) {
      req_promise = Promise.race([
        req_promise,
        new Promise((resolve, reject) =>
          setTimeout(() => {
            // TOOO: 国际化
            reject(new Error("TIME OUT"));
          }, timeout_ms),
        ),
      ]);
    }
    return this._handlePromise(req_promise, catch_key);
  }
  get<T>(
    url: string | AppUrl,
    options: RequestOptionsArgs = {},
    no_token?: boolean,
    auto_cache?: boolean,
  ): Promise<T> {
    return this._requestWithApiService(
      "get",
      url.toString(),
      void 0,
      options,
      no_token,
      auto_cache,
    );
  }
  post<T>(
    url: string | AppUrl,
    body: any = {},
    options: RequestOptionsArgs = {},
    no_token?: boolean,
    auto_cache?: boolean,
  ): Promise<T> {
    return this._requestWithApiService(
      "post",
      url.toString(),
      body,
      options,
      no_token,
      auto_cache,
    );
  }
  put<T>(
    url: string | AppUrl,
    body: any = {},
    options: RequestOptionsArgs = {},
    no_token?: boolean,
    auto_cache?: boolean,
  ): Promise<T> {
    return this._requestWithApiService(
      "put",
      url.toString(),
      body,
      options,
      no_token,
      auto_cache,
    );
  }
  delete<T>(
    url: string | AppUrl,
    options: RequestOptionsArgs = {},
    no_token?: boolean,
    auto_cache?: boolean,
  ): Promise<T> {
    return this._requestWithApiService(
      "delete",
      url.toString(),
      void 0,
      options,
      no_token,
      auto_cache,
    );
  }
  private _auto_cache;
  private get auto_cache() {
    const res = this._auto_cache;
    // 一次性取值，取完就不用了
    this._auto_cache = undefined;
    return res;
  }
  autoCache(auto_cache?: boolean): AppFetchProvider {
    this._auto_cache = auto_cache;
    return this;
  }
  private _timeout_ms;
  private get timeout_ms() {
    const res = this._timeout_ms;
    // 一次性取值，取完就不用了
    this._timeout_ms = undefined;
    return res;
  }
  timeout(timeout_ms?: number): AppFetchProvider {
    this._timeout_ms = timeout_ms;
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
