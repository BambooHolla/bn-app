/*通用的AppUrl*/
import { baseConfig } from './baseConfig';
export class AppUrl {
  static get SERVER_URL() { return baseConfig.SERVER_URL }
  static get BACKEND_VERSION() { return baseConfig.BACKEND_VERSION }
  static getPathName(url: string) {
    return new URL(url).pathname.replace("/api/" + AppUrl.BACKEND_VERSION, "/api/");
  }
  constructor(public path: string) { }
  toString(query?) {
    let { disposable_server_url, disposable_backend_version } = this;
    if (typeof disposable_server_url !== "string") {
      disposable_server_url = AppUrl.SERVER_URL
    }
    if (typeof disposable_backend_version !== "string") {
      disposable_backend_version = AppUrl.BACKEND_VERSION
    }

    const host = disposable_server_url
      + this.path.replace(/^\/api\//, "/api/" + disposable_backend_version);
    if (query) {
      const querystring: string[] = [];
      for (var k in query) {
        querystring.push(`${k}=${encodeURIComponent(query[k])}`);
      }
      return host + (querystring.length ? `?${querystring.join("&")}` : "");
    }
    return host;
  }
  _disposable_server_url?: string;
  get disposable_server_url() {
    const res = this._disposable_server_url;
    this._disposable_server_url = undefined;
    return res;
  }
  disposableServerUrl(server_url: string) {
    this._disposable_server_url = server_url;
    return this;
  }
  _disposable_backend_version?: string;
  get disposable_backend_version() {
    const res = this._disposable_backend_version;
    this._disposable_backend_version = undefined;
    return res;
  }
  disposablBackendVersion(backend_version: string) {
    this._disposable_backend_version = backend_version;
    return this;
  }
}
