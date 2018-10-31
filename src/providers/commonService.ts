import EventEmitter from "eventemitter3";
import { AppUrl } from "../bnqkl-framework/helper";
export { AppUrl };
export class CommonService extends EventEmitter {
  fetch?: import("./app-fetch/app-fetch").AppFetchProvider;
  oneTimeUrl(app_url: AppUrl, server_url: string, force_network?: boolean, backend_version?: string) {
    app_url.disposableServerUrl(server_url);
    if (typeof backend_version === "string") {
      app_url.disposablBackendVersion(backend_version);
    }
    this.fetch && this.fetch.forceNetwork(force_network);
    return this;
  }
}
