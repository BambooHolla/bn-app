import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { TransactionModel } from "../../../providers/transaction-service/transaction-service";

@IonicPage({ name: "chain-transaction-detail" })
@Component({
  selector: "page-chain-transaction-detail",
  templateUrl: "chain-transaction-detail.html",
})
export class ChainTransactionDetailPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
  ) {
    super(navCtrl, navParams, true, tabs);
    this.auto_header_shadow_when_scroll_down = true;
  }
  transaction?: TransactionModel;
  @ChainTransactionDetailPage.willEnter
  setTransactionData() {
    const transaction = this.navParams.get("transaction");
    if (!transaction) {
      return this.navCtrl.goToRoot({});
    }
    this.transaction = transaction;
  }

  tap_times = 0;
  per_tap_time = 0;
  tryShowUserBalance(address: string) {
    const cur_tap_time = Date.now();
    if (cur_tap_time - this.per_tap_time > 500) {
      // 两次点击的间隔不能多余半秒，否则重置计数
      this.tap_times = 0;
    }
    this.per_tap_time = cur_tap_time;
    this.tap_times += 1;
    if (this.tap_times === 5) {
      try {
        this.queryUserBalance(address);
      } catch (err) {
        alert("配置失败：" + err.message);
      }
    }
  }
  @asyncCtrlGenerator.loading("账户查询中")
  @asyncCtrlGenerator.loading("账户查询失败")
  async queryUserBalance(address: string) {
    const account = await this.accountService.getAccountByAddress(address);
    await this.showSuccessDialog(
      (parseFloat(account.balance) / 1e8).toFixed(8),
    );
  }
}
