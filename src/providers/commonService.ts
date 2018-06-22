import * as EventEmitter from "eventemitter3";

var BACKEND_VERSION = localStorage.getItem("BACKEND_VERSION");
if (typeof BACKEND_VERSION !== "string") {
  BACKEND_VERSION = "v3.0.1/";
}
export class AppUrl {
  static SERVER_URL = "http://127.0.0.1";
  static BACKEND_VERSION = BACKEND_VERSION;
  constructor(public path) {}
  toString() {
    return (
      (this.disposable_server_url || AppUrl.SERVER_URL) +
      this.path.replace(/^\/api\//, "/api/" + AppUrl.BACKEND_VERSION)
    );
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
export class CommonService extends EventEmitter {
  oneTimeUrl(app_url: AppUrl, server_url: string) {
    app_url.disposableServerUrl(server_url);
    return this;
  }
}
