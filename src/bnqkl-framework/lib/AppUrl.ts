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
    const host = (this.disposable_server_url || AppUrl.SERVER_URL) + this.path.replace(/^\/api\//, "/api/" + AppUrl.BACKEND_VERSION);
    if (query) {
      let querystring = "?";
      for (var k in query) {
        querystring += `${k}=${encodeURIComponent(query[k])}`;
      }
      return host + querystring;
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
}
