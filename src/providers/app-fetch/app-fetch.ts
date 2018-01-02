import { Storage } from "@ionic/storage";
import { Injectable } from "@angular/core";
import { Http, Headers, RequestOptionsArgs } from "@angular/http";

import { AppUrl } from "../app-setting/app-setting";

import { AppSettingProvider } from "../app-setting/app-setting";

export class ServerResError extends Error {
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
    return new ServerResError(CODE_LIST, MESSAGE);
  }
  constructor(code_list: string[], message: string) {
    super(code_list.map(c => `<small>${c}</small>`).join("") + message);
    this.MESSAGE = String(message);
    this.CODE_LIST = code_list;
    this.stack += "\t\n" + code_list.join("\t\n");
  }
  CODE_LIST: string[];
  CODE: string;
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
  private _user_token: string;

  constructor(
    public http: Http,
    public appSetting: AppSettingProvider,
    public storage: Storage,
  ) {
    console.log("Hello AppFetchProvider Provider");
    window["FETCH"] = this;
    this.appSetting.user_token.subscribe(val => {
      this._user_token = val;
    });

    // const methods = [
    //   "get",
    //   "delete",
    //   "head",
    //   "options",
    //   "post",
    //   "put",
    //   "patch",
    // ];
  }

  private _handleResThen(res) {
    const data = res.json();
    // console.log('login:', data);
    const err = data.error || data.err;
    if (!err) {
      if (typeof data.data !== "object") {
        return Promise.reject(new TypeError("服务器响应的数据有误"));
      }
      // 传递来自缓存功能的隐藏异常
      data.__source_err__ && (data.data.__source_err__ = data.__source_err__);
      return data.data;
    } else {
      debugger;
      return Promise.reject(
        ServerResError.parseErrorMessage(err.code, err.message),
      );
    }
  }
  private _handleResCatch(res) {
    const data = res.json();
    const error = res.json().error;
    debugger;
    if (error) {
      return Promise.reject(
        error.code
          ? ServerResError.parseErrorMessage(error.code, error.message)
          : error.message,
      );
    } else {
      if (data) {
        if (
          data.constructor.name === "ProgressEvent" ||
          data.constructor.name === "XMLHttpRequestProgressEvent"
        ) {
          return Promise.reject("网络异常");
        }
        return Promise.reject(data);
      } else {
        return Promise.reject("未知异常");
      }
    }
  }
  private _catchData() {}
  private _handlePromise(
    promise: Promise<any>,
    auto_cache?: boolean,
    catch_key?: string,
  ) {
    if (auto_cache) {
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
              cache_data.__source_err__ = await this._handleResCatch(
                response,
              ).catch(err => err);
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
    return promise.catch(this._handleResCatch).then(this._handleResThen);
  }
  private _handleUrlAndOptions(
    url: string,
    options: RequestOptionsArgs = {},
    without_token?: boolean,
  ) {
    if (!without_token) {
      const headers = options.headers || (options.headers = new Headers());
      headers.append("X-AUTH-TOKEN", this._user_token);
    }
    const params = options.params as { [key: string]: any };
    if (params && params.constructor === Object) {
      delete options.params;
      console.log(url);
      for (let key in params) {
        const val = params[key];
        url = url.replace(new RegExp(`\:${key}`, "g"), val);
      }
      console.log(url);
    }
    return { url, options };
  }
  private _request(
    method: string,
    url: string,
    body: any,
    options: RequestOptionsArgs = {},
    without_token?: boolean,
    auto_cache?: boolean,
  ) {
    // 获取外部的默认值并自动重置，一定要触发getter
    const default_auto_cache = this.auto_cache;
    if (auto_cache === undefined) {
      auto_cache = default_auto_cache;
    }
    if (auto_cache) {
      const url_info = new URL(url);
      var catch_key =
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
    return this._handlePromise(req.toPromise(), auto_cache, catch_key);
  }
  get<T>(
    url: string | AppUrl,
    options: RequestOptionsArgs = {},
    no_token?: boolean,
    auto_cache?: boolean,
  ): Promise<T> {
    return this._request(
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
    return this._request(
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
    return this._request(
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
    return this._request(
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
}
