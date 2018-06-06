import {
  Component,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  Refresher,
  InfiniteScroll,
} from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { PAGE_STATUS } from "../../bnqkl-framework/const";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { Subscription } from "rxjs/Subscription";
// import { Network } from '@ionic-native/network';

import {
  TransactionServiceProvider,
  TransactionTypes,
  TransactionModel,
} from "../../providers/transaction-service/transaction-service";
import {
  VoucherServiceProvider,
  ExchangeStatus,
} from "../../providers/voucher-service/voucher-service";

function generateRollOutLog(len = 20, from = Date.now()) {
  return Array.from(Array(len)).map(_ => {
    return {};
  });
}

// @IonicPage({ name: "tab-pay" })
@Component({
  selector: "page-tab-pay",
  templateUrl: "tab-pay.html",
})
export class TabPayPage extends FirstLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    // public transfer: TransferProvider,
    public transactionService: TransactionServiceProvider,
    public voucherService: VoucherServiceProvider,
    public cdRef: ChangeDetectorRef, // public network: Network
  ) {
    super(navCtrl, navParams);
    this.enable_timeago_clock = true;
    this.event.on("job-finished", async ({ id, data }) => {
      console.log("job-finished", id, data);
      if (id === "account-my-contacts") {
        this.formData.transfer_address = data.address;
      }
      if (id === "account-scan-add-contact") {
        if (typeof data === "string") {
          this.formData.transfer_address = data;
        } else if (data && data.protocol === "ifmchain-transaction") {
          this.receiptOfflineTransaction(data.transaction);
        }
      }
    });
  }
  formData = {
    transfer_address: "",
    transfer_amount: "",
    transfer_mark: "",
    transfer_fee: parseFloat(this.appSetting.settings.default_fee),
  };

  @asyncCtrlGenerator.error()
  async receiptOfflineTransaction(tran: TransactionModel) {
    if (tran.recipientId !== this.userInfo.address) {
      throw new Error(
        this.getTranslateSync(
          "THE_RECIPIENT_OF_THIS_TRANSACTION_VOUCHER_IS_NOT_THE_CURRENT_ACCOUNT",
        ),
      );
    }
    // todo: check voucher is my
    if (navigator.onLine) {
      await this.putThirdTransaction(tran);
    } else {
      await this.showReceiptToVoucher(tran);
    }
  }

  @asyncCtrlGenerator.error()
  async putThirdTransaction(tran: TransactionModel) {
    const add_res = await this.voucherService.addVoucher({
      exchange_status: ExchangeStatus.UNSUBMIT,
      ...tran,
    });

    await this.transactionService.putThirdTransaction(tran);
    this.showTransferReceipt(tran);
  }

  @asyncCtrlGenerator.error()
  async showReceiptToVoucher(transaction: TransactionModel) {
    if (!transaction) {
      throw new Error(await this.getTranslate("COULD_NOT_FOUND_TRANSFER"));
    }
    return this.modalCtrl
      .create(
        "pay-receipt-to-voucher",
        {
          transaction,
        },
        {
          cssClass: "transfer-receipt-modal",
          showBackdrop: true,
          enableBackdropDismiss: false,
        },
      )
      .present();
  }

  @asyncCtrlGenerator.error("@@FEE_INPUT_ERROR")
  async setTransferFee() {
    const { custom_fee } = await this.getCustomFee(this.formData.transfer_fee);
    this.formData.transfer_fee = custom_fee;
  }

  @TabPayPage.setErrorTo("errors", "transfer_address", ["wrongAddress"])
  check_transfer_address() {
    if (
      !this.transactionService.isAddressCorrect(this.formData.transfer_address)
    ) {
      return { wrongAddress: true };
    }
  }
  ignore_keys = ["transfer_mark"];

  @TabPayPage.setErrorTo("errors", "transfer_amount", ["rangeError"])
  check_transfer_amount() {
    const { transfer_amount } = this.formData;
    if (typeof transfer_amount === "number") {
      if (
        transfer_amount < 0 ||
        transfer_amount > parseFloat(this.userInfo.balance) / 1e8
      ) {
        return {
          rangeError: true,
        };
      }
    }
  }
  @asyncCtrlGenerator.error()
  async submit() {
    const { password, pay_pwd } = await this.getUserPassword();
    let online = navigator.onLine;
    if (online) {
      try {
        const { transfer } = await this._submit(
          password,
          pay_pwd,
          this.formData.transfer_fee,
        );
        this.resetFormData();
        this.showTransferReceipt(transfer);
      } catch (err) {
        console.error("online but peer no work", err);
        online = false;
      }
    }

    if (!online) {
      // 离线凭证
      const {
        transfer_address,
        transfer_amount,
        transfer_mark,
      } = this.formData;
      const txData = this.transactionService.createTxData(
        transfer_address,
        transfer_amount,
        this.formData.transfer_fee,
        password,
        pay_pwd,
      );
      const { transaction } = await this.transactionService.createTransaction(
        txData,
      );
      this.routeTo("pay-offline-receipt", { transaction });
    }
  }
  @asyncCtrlGenerator.error("@@SHOW_TRANSFER_RECEIPT_FAIL")
  @asyncCtrlGenerator.retry()
  async showTransferReceipt(transfer: TransactionModel) {
    if (!transfer) {
      throw new Error(await this.getTranslate("COULD_NOT_FOUND_TRANSFER"));
    }
    return this.modalCtrl
      .create(
        "pay-transfer-receipt",
        {
          transfer,
        },
        {
          cssClass: "transfer-receipt-modal",
          showBackdrop: true,
          enableBackdropDismiss: false,
        },
      )
      .present();
  }

  resetFormData() {
    super.resetFormData();
    this.formData.transfer_amount = "";
  }
  @asyncCtrlGenerator.error(() =>
    TabPayPage.getTranslate("TRANSFER_SUBMIT_ERROR"),
  )
  @asyncCtrlGenerator.loading(() =>
    TabPayPage.getTranslate("TRANSFER_SUBMITING"),
  )
  @asyncCtrlGenerator.success(() =>
    TabPayPage.getTranslate("TRANSFER_SUBMIT_SUCCESS"),
  )
  _submit(password: string, pay_pwd?: string, custom_fee?: number) {
    const { transfer_address, transfer_amount, transfer_mark } = this.formData;
    return this.transactionService.transfer(
      transfer_address,
      transfer_amount,
      custom_fee,
      password,
      pay_pwd,
    );
  }

  roll_out_logs: TransactionModel[] = [];
  listTrackBy(index, item: TransactionModel) {
    return item.id;
  }
  roll_out_config = {
    loading: false,
    has_more: true,
    pageSize: 20,
    page: 1,
  };

  async loadRollOutLogs(refresher?: Refresher) {
    const { roll_out_config } = this;
    // 重置分页
    roll_out_config.page = 1;
    const list = await this._getUserTransactions();
    this.roll_out_logs = list;

    if (refresher) {
      refresher.complete();
    }
  }

  async loadMoreRollOutLogs() {
    const { roll_out_config } = this;
    roll_out_config.page += 1;
    const list = await this._getUserTransactions();

    this.roll_out_logs
      ? this.roll_out_logs.push(...list)
      : (this.roll_out_logs = list);
  }
  private async _getUserTransactions() {
    const { roll_out_config } = this;
    roll_out_config.loading = true;
    try {
      const list = await this.transactionService.getUserTransactions(
        this.userInfo.address,
        roll_out_config.page,
        roll_out_config.pageSize,
        "out",
        TransactionTypes.SEND,
      );
      roll_out_config.has_more = list.length >= roll_out_config.pageSize;
      return list;
    } finally {
      roll_out_config.loading = false;
    }
  }

  @TabPayPage.addEvent("HEIGHT:CHANGED")
  @asyncCtrlGenerator.error(() =>
    TabPayPage.getTranslate("TRANSFER_UPDATE_ERROR"),
  )
  @asyncCtrlGenerator.retry()
  async watchHeightChange(height) {
    return this.loadRollOutLogs();
  }
}
