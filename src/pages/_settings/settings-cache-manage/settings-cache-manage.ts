import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { PromiseOut } from "../../../bnqkl-framework/PromiseExtends";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";

@IonicPage({ name: "settings-cache-manage" })
@Component({
  selector: "page-settings-cache-manage",
  templateUrl: "settings-cache-manage.html",
})
export class SettingsCacheManagePage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  calcing = true;
  // 多次进入只需要计算一次
  private _calc_promise_out?: PromiseOut<void>;
  @SettingsCacheManagePage.willEnter
  doCalc() {
    if (this._calc_promise_out) {
      return this._calc_promise_out.promise;
    }
    this.calcing = true;
    const calc_promise_out = (this._calc_promise_out = new PromiseOut());
    try {
      calc_promise_out.resolve();
    } catch (err) {
      calc_promise_out.reject(err);
      this._calc_promise_out = undefined;
    } finally {
      this.calcing = false;
      setTimeout(() => {
        this._calc_promise_out = undefined;
      }, 6e4);
    }
  }
}
