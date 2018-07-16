import EventEmitter from "eventemitter3";
import { AppUrl } from "../bnqkl-framework/helper";
export { AppUrl };
export class CommonService extends EventEmitter {
  oneTimeUrl(app_url: AppUrl, server_url: string) {
    app_url.disposableServerUrl(server_url);
    return this;
  }
}
