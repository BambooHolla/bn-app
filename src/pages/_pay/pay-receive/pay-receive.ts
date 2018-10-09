import {
  Component,
  Optional,
  ViewChild,
  ChangeDetectorRef,
} from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import {
  IonicPage,
  NavController,
  NavParams,
  Refresher,
  Content,
} from "ionic-angular/index";
import {
  TransactionServiceProvider,
  TransactionTypes,
  TransactionModel,
} from "../../../providers/transaction-service/transaction-service";
import { LocalContactProvider } from "../../../providers/local-contact/local-contact";

@IonicPage({ name: "pay-receive" })
@Component({
  selector: "page-pay-receive",
  templateUrl: "pay-receive.html",
})
export class PayReceivePage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public transactionService: TransactionServiceProvider,
    @Optional() public tabs: TabsPage,
    public cdRef: ChangeDetectorRef,
    public localContact: LocalContactProvider
  ) {
    super(navCtrl, navParams, true, tabs);
  }

  receive_logs: TransactionModel[] = [];
  listTrackBy(index, item: TransactionModel) {
    return item.id;
  }
  receive_config = {
    loading: false,
    has_more: true,
    pageSize: 20,
    page: 1,
  };

  async loadReceiveLogs(refresher?: Refresher) {
    const { receive_config } = this;
    // 重置分页
    receive_config.page = 1;
    const list = await this._getUserTransactions();
    this.receive_logs = list;

    if (refresher) {
      refresher.complete();
    }
  }

  async loadMoreReceiveLogs() {
    const { receive_config } = this;
    receive_config.page += 1;
    const list = await this._getUserTransactions();

    this.receive_logs
      ? this.receive_logs.push(...list)
      : (this.receive_logs = list);
  }
  private async _getUserTransactions() {
    const { receive_config } = this;
    receive_config.loading = true;
    try {
      const list = await this.transactionService.getUserTransactions(
        this.userInfo.address,
        receive_config.page,
        receive_config.pageSize,
        "in"
      );
      receive_config.has_more = list.length >= receive_config.pageSize;
      return this.localContact.formatTransactionWithLoclContactNickname(list);
    } finally {
      receive_config.loading = false;
    }
  }

  @PayReceivePage.addEvent("HEIGHT:CHANGED")
  @asyncCtrlGenerator.error(() =>
    PayReceivePage.getTranslate(
      "UPDATE_RECIVE_FAILED-TOO_MANY_RETRIES-HAS_STOPPED_RETRY-PLEASE_CHECK_THE_NETWORK"
    )
  )
  @asyncCtrlGenerator.retry()
  async watchHeightChange(height) {
    return this.loadReceiveLogs();
  }
}
