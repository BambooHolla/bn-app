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
import {
  asyncCtrlGenerator,
  formatAndTranslateMessage,
} from "../../bnqkl-framework/Decorator";
import { Subscription } from "rxjs/Subscription";
import {
  AssetsServiceProvider,
  AssetsModelWithLogoSafeUrl,
} from "../../providers/assets-service/assets-service";

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
    public assetsService: AssetsServiceProvider
  ) {
    super(navCtrl, navParams);
    this.enable_timeago_clock = true;
    this.event.on("job-finished", async ({ id, data }) => {
      console.log("job-finished", id, data);
      if (
        id === "pay-select-my-contacts" ||
        id === "pay-select-my-local-contacts"
      ) {
        this.formData.transfer_address = data.address;
        this.markForCheck();
      }
      if (id === "account-scan-add-contact") {
        if (typeof data === "string") {
          this.formData.transfer_address = data;
          this.markForCheck();
        } else if (data && data.protocol === "ifmchain-transaction") {
          this.receiptOfflineTransaction(data.transaction);
        }
      }
    });
  }
  formData = {
    transfer_address: "",
    transfer_amount: 0,
    transfer_mark: "",
    transfer_fee: parseFloat(this.appSetting.settings.default_fee),
  };
  /*用于错误提示输入*/
  formDataKeyI18nMap = {
    transfer_address: "@@TRANSFER_ADDRESS",
    transfer_amount: "@@TRANSFER_AMOUNT",
    transfer_mark: "@@TRANSFER_MARK",
    transfer_fee: "@@TRANSFER_FEE",
  };
  /*尝试设置交易手续费*/
  @TabPayPage.willEnter
  tryResetTransferFee() {
    if (this.formData.transfer_fee === 0) {
      this.formData.transfer_fee = parseFloat(
        this.appSetting.settings.default_fee
      );
    }
  }

  @asyncCtrlGenerator.error()
  async receiptOfflineTransaction(tran: TransactionModel) {
    if (tran.recipientId !== this.userInfo.address) {
      throw new Error(
        this.getTranslateSync(
          "THE_RECIPIENT_OF_THIS_TRANSACTION_VOUCHER_IS_NOT_THE_CURRENT_ACCOUNT"
        )
      );
    }
    // todo: check voucher is my
    if (this.webio.onLine) {
      await this.putThirdTransaction(tran);
    } else {
      await this.showReceiptToVoucher(tran);
    }
  }

  @asyncCtrlGenerator.error()
  async putThirdTransaction(tran: TransactionModel) {
    const voucher = {
      exchange_status: ExchangeStatus.UNSUBMIT,
      ...tran,
    };
    if (!(await this.voucherService.addVoucher(voucher))) {
      // 已经存在了，不重复操作
      throw new Error(
        this.getTranslateSync(
          "THIS_TRANSACTION_IS_ALREADY_IN_YOUR_VOUCHER_WALLET"
        )
      );
    } else {
      await this.transactionService.putThirdTransaction(tran);
      // 将凭证的状态改成已经提交
      voucher.exchange_status = ExchangeStatus.SUBMITED;
      await this.voucherService.updateVoucher(voucher);
    }

    await this.showTransferReceipt(tran);
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
        }
      )
      .present();
  }

  @asyncCtrlGenerator.error("@@FEE_INPUT_ERROR")
  async setTransferFee() {
    const { custom_fee } = await this.getCustomFee(this.formData.transfer_fee);
    this.formData.transfer_fee = custom_fee;
    this.setInputstatus("transfer_fee", { type: "input" });
    this.markForCheck();
  }

  @TabPayPage.setErrorTo("errors", "transfer_address", ["wrongAddress"])
  check_transfer_address() {
    const transfer_address = this.formData.transfer_address.trim();
    if (transfer_address === this.userInfo.address) {
      return {
        wrongAddress: "@@TRANSFER_DESTINATION_CAN_NOT_BE_YOURSELF",
      };
    }
    if (!this.transactionService.isAddressCorrect(transfer_address)) {
      return { wrongAddress: "@@TRANSFER_ADDRESS_IS_MALFORMED" };
    }
  }
  ignore_keys = ["transfer_mark"];

  private _check_total_amount(user_balance: number) {
    if (user_balance === 0) {
      return {
        NoBalance: "@@USER_HAS_NO_BALANCE",
      };
    }
    const { transfer_amount, transfer_fee } = this.formData;
    const total_amount = transfer_amount + transfer_fee;
    if (total_amount > user_balance) {
      return {
        NoEnoughBalance: "@@USER_HAS_NO_ENOUGH_BALANCE",
      };
    }
  }
  @TabPayPage.setErrorTo("errors", "transfer_amount", [
    "NoBalance",
    "NoEnoughBalance",
    "ErrorRange",
  ])
  check_transfer_amount() {
    const { transfer_amount, transfer_fee } = this.formData;
    const user_balance = parseFloat(this.selected_assets.hodingAssets) / 1e8;

    if (transfer_amount < 0.00000001) {
      return {
        ErrorRange: "@@TOO_LITTLE_TRANSFER_AMOUNT",
      };
    }
    return this._check_total_amount(user_balance);
  }
  @TabPayPage.setErrorTo("errors", "transfer_fee", [
    "NoBalance",
    "NoEnoughBalance",
    "ErrorRange",
  ])
  check_transfer_fee() {
    const { transfer_amount, transfer_fee } = this.formData;
    const user_balance = parseFloat(this.userInfo.balance) / 1e8;

    if (transfer_fee < 0.00000001) {
      return {
        ErrorRange: "@@TOO_LITTLE_FEE",
      };
    }
    // return this._check_total_amount(user_balance);
  }
  @asyncCtrlGenerator.error()
  async submit() {
    if (!this.appSetting.settings._is_show_first_transfer_tip) {
      if (
        !(await this.waitTipDialogConfirm("@@FIRST_TRANSFER_TIP", {
          true_text: "@@OK",
        }))
      ) {
        return;
      }
      this.appSetting.settings._is_show_first_transfer_tip = true;
    }
    const { password, pay_pwd } = await this.getUserPassword({
      title: "@@SUBMIT_TRANSFER_TITLE",
    });
    let online = this.webio.onLine;
    if (online) {
      // try {
      const { transfer } = await this._submit(
        password,
        pay_pwd,
        this.formData.transfer_fee
      );
      await this.showTransferReceipt(transfer);
      this.resetFormData();
      // } catch (err) {
      //   console.error("online but peer no work", err);
      //   online = false;
      // }
    }

    if (!online) {
      if (!this.appSetting.settings._is_first_show_offline_pay) {
        if (!(await this.waitTipDialogConfirm("@@OFFLINE_TRANFER_TIP"))) {
          return;
        }
        this.appSetting.settings._is_first_show_offline_pay = true;
      }
      // 离线凭证
      const {
        transfer_address,
        transfer_amount,
        transfer_mark,
      } = this.formData;
      const txData = this.transactionService.createTxData(
        transfer_address.trim(),
        transfer_amount,
        this.formData.transfer_fee,
        password,
        pay_pwd
      );
      const { transaction } = await this.transactionService.createTransaction(
        txData
      );
      this.resetFormData();
      this.routeTo("pay-offline-receipt", { transaction });
    }
  }
  /*辅助用户填写表单*/
  async helpSubmit(has_err) {
    // 如果错误是因为没有填写手续费，那帮助用户弹出手续费输入框
    if (this.formData.transfer_fee === 0) {
      this.showConfirmDialog("@@YOU_NEED_SET_TRANSFER_FEE-SET_IT_NOW", () => {
        this.setTransferFee();
      });
    } else {
      const message = await formatAndTranslateMessage(has_err);
      this.toastCtrl
        .create({
          message,
          duration: 2000,
        })
        .present();
    }
  }
  // @asyncCtrlGenerator.error("@@SHOW_TRANSFER_RECEIPT_FAIL")
  async showTransferReceipt(transfer: TransactionModel) {
    if (!transfer) {
      throw new Error(this.getTranslateSync("COULD_NOT_FOUND_TRANSFER"));
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
        }
      )
      .present();
  }

  resetFormData() {
    super.resetFormData();
    delete this.formData.transfer_amount;
    this.markForCheck();
  }
  @asyncCtrlGenerator.error(() =>
    TabPayPage.getTranslate("TRANSFER_SUBMIT_ERROR")
  )
  @asyncCtrlGenerator.loading(() =>
    TabPayPage.getTranslate("TRANSFER_SUBMITING")
  )
  @asyncCtrlGenerator.success(() =>
    TabPayPage.getTranslate("TRANSFER_SUBMIT_SUCCESS")
  )
  _submit(password: string, pay_pwd?: string, custom_fee?: number) {
    const { transfer_address, transfer_amount, transfer_mark } = this.formData;
    return this.transactionService.transfer(
      transfer_address,
      transfer_amount,
      custom_fee,
      password,
      pay_pwd,
      this.selected_assets === this.ibt_assets
        ? undefined
        : this.selected_assets.abbreviation
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
        "out"
      );
      roll_out_config.has_more = list.length >= roll_out_config.pageSize;
      return list;
    } finally {
      roll_out_config.loading = false;
    }
  }

  @TabPayPage.addEvent("HEIGHT:CHANGED")
  @asyncCtrlGenerator.error(() =>
    TabPayPage.getTranslate("TRANSFER_UPDATE_ERROR")
  )
  @asyncCtrlGenerator.retry()
  async watchHeightChange(height) {
    return this.loadRollOutLogs();
  }

  /**选中的资产*/
  readonly ibt_assets = (() => {
    const userInfo = this.userInfo;
    return {
      ...this.assetsService.ibt_assets,
      get hodingAssets() {
        return userInfo.balance;
      },
    };
  })();
  @TabPayPage.markForCheck selected_assets = this.ibt_assets;
  @TabPayPage.markForCheck
  selectable_assets_list: AssetsModelWithLogoSafeUrl[] = [];

  /**资产选择面板是否打开*/
  @TabPayPage.markForCheck is_assets_select_panel_open = false;
  assets_page_info = {
    loading: false,
  };
  /**打开、关闭 资产选择面板*/
  toggleAssetsSelectPanel(state = !this.is_assets_select_panel_open) {
    this.is_assets_select_panel_open = state;
    if (this.is_assets_select_panel_open) {
      this.loadAllSelectableAssetsList();
    }
  }
  tryCloseAssetsSelectPanel($event: Event) {
    const ele = $event.target as HTMLElement | null;
    if (ele) {
      if (ele.classList.contains("assets-select-panel-overlayer")) {
        this.toggleAssetsSelectPanel(false);
      }
    }
  }

  /**查询所有资产*/
  @asyncCtrlGenerator.single()
  @asyncCtrlGenerator.error()
  async loadAllSelectableAssetsList() {
    const current_height = this.appSetting.getHeight();
    const { assets_page_info } = this;
    assets_page_info.loading = true;
    try {
      const my_all_assets = await this.assetsService.myAssetsList.getPromise();
      this.selectable_assets_list = [this.ibt_assets, ...my_all_assets];
    } finally {
      assets_page_info.loading = false;
    }
  }

  // @asyncCtrlGenerator.single()
  // @asyncCtrlGenerator.error()
  private _updateSelectedAssets() {
    const { selected_assets } = this;
    const new_selected_assets = this.selectable_assets_list.find(
      assets => assets.abbreviation === selected_assets.abbreviation
    );
    this.selected_assets = new_selected_assets || this.ibt_assets;
  }

  /**选择某一个资产*/
  selectAssets(assets: AssetsModelWithLogoSafeUrl) {
    this.selected_assets = assets;
    this.toggleAssetsSelectPanel();
    this.check_transfer_amount(); // 检测金额问题
  }

  /*高度变动的时候，更新资产列表，以及选择的资产*/
  @TabPayPage.addEvent("HEIGHT:CHANGED")
  @asyncCtrlGenerator.error("@@ASSETS_LIST_UPDATE_ERROR")
  @asyncCtrlGenerator.retry()
  async refreshAssetsList(height) {
    if (this.selected_assets !== this.ibt_assets) {
      await this.loadAllSelectableAssetsList();
      this._updateSelectedAssets();
    } else if (this.is_assets_select_panel_open) {
      await this.loadAllSelectableAssetsList();
    }
  }
}
