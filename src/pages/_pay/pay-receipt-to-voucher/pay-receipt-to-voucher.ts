import { Component, Optional, ViewChild, ElementRef } from "@angular/core";
import {
  IonicPage,
  NavController,
  ViewController,
  NavParams,
} from "ionic-angular";

import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import {
  TransactionServiceProvider,
  TransactionTypes,
  TransactionModel,
} from "../../../providers/transaction-service/transaction-service";
import {
  VoucherServiceProvider,
  ExchangeStatus,
  VoucherModel,
} from "../../../providers/voucher-service/voucher-service";

@IonicPage({ name: "pay-receipt-to-voucher" })
@Component({
  selector: "page-pay-receipt-to-voucher",
  templateUrl: "pay-receipt-to-voucher.html",
})
export class PayReceiptToVoucherPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public transactionService: TransactionServiceProvider,
    public viewCtrl: ViewController,
    @Optional() public tabs: TabsPage,
    public voucherService: VoucherServiceProvider,
  ) {
    super(navCtrl, navParams, true, tabs);
  }

  transaction!: TransactionModel;
  @PayReceiptToVoucherPage.willEnter
  initData() {
    const transaction = this.navParams.get("transaction") as TransactionModel;
    if (!transaction) {
      return this.navCtrl.goToRoot({});
    }
    this.transaction = transaction;
  }
  /*是否已经在钱包中*/
  already_in_wallet = false;
  @asyncCtrlGenerator.success(
    "@@SUCCESSFULLY_PUT_THIS_TRANSACTION_IN_TO_VOUCHER_WALLET",
  )
  @asyncCtrlGenerator.error()
  async putIntoVoucherWallet() {
    if (this.already_in_wallet) {
      this.closeModal();
      return;
    }
    const voucher: VoucherModel = {
      ...this.transaction,
      exchange_status: ExchangeStatus.UNSUBMIT,
    };
    if (!(await this.voucherService.addVoucher(voucher))) {
      this.already_in_wallet = true;
      throw new Error(
        this.getTranslateSync(
          "THIS_TRANSACTION_IS_ALREADY_IN_YOUR_VOUCHER_WALLET",
        ),
      );
    }
    this.closeModal();
  }
  closeModal() {
    return this.viewCtrl.dismiss();
  }
}
