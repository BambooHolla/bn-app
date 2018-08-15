import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import {
  BlockServiceProvider,
  BlockModel,
  SingleBlockModel,
} from "../../../providers/block-service/block-service";
import {
  TransactionModel,
  TransactionTypes,
  TransactionServiceProvider,
} from "../../../providers/transaction-service/transaction-service";
import { LocalContactProvider } from "../../../providers/local-contact/local-contact";
import { TimestampPipe } from "../../../pipes/timestamp/timestamp";
import {
  MinServiceProvider,
  DelegateModel,
} from "../../../providers/min-service/min-service";

@IonicPage({ name: "chain-block-detail" })
@Component({
  selector: "page-chain-block-detail",
  templateUrl: "chain-block-detail.html",
})
export class ChainBlockDetailPage extends SecondLevelPage {
  TransactionTypes = TransactionTypes;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public blockService: BlockServiceProvider,
    public transactionService: TransactionServiceProvider,
    public minService: MinServiceProvider,
    public localContact: LocalContactProvider
  ) {
    super(navCtrl, navParams, true, tabs);
    this.enable_timeago_clock = true;
  }
  isShowFullDate(timestamp: number) {
    const time = TimestampPipe.transform(timestamp);
    if (time.valueOf() < Date.now() - 24 * 60 * 60 * 1000) {
      return true;
    }
    return false;
  }
  show_all_remark = false;
  async toggleShowAllRemark() {
    if (
      !this.show_all_remark &&
      !this.appSetting.settings._is_show_first_block_remark
    ) {
      this.appSetting.settings._is_show_first_block_remark = await this.waitTipDialogConfirm(
        "@@FIRST_VIEW_BLOCK_REMARK_TIP"
      );
    }
    this.show_all_remark = !this.show_all_remark;
  }
  block_info?: BlockModel;
  pre_block_id?: string;
  tran_list: TransactionModel[] = [];
  tran_list_config = {
    loading: false,
    page: 1,
    pageSize: 20,
    has_more: true,
  };
  @ChainBlockDetailPage.willEnter
  async initAndLoadData(block_id?: string) {
    let block: BlockModel | undefined;
    if (!block) {
      // block_id优先级比较高
      if (typeof block_id === "string") {
        block = await this.blockService.getBlockById(block_id);
      }
    }
    if (!block) {
      // 内存里头有的直接用内存的
      block = this.navParams.get("block");
    }
    if (!block) {
      // 是在没有只能根据高度查询了
      const height = this.navParams.get("height");
      if (typeof height === "number") {
        block = await this.blockService.getBlockByHeight(height);
      }
    }
    if (!block) {
      return this.navCtrl.goToRoot({});
    }
    if (this.block_info == block) {
      return;
    }
    if (block) {
      this.block_info = block;
      this.loadTranLogs();
      this.loadDelegateInfo();
    }
  }

  get block_confirmations() {
    if (this.block_info && this._lastBlock) {
      return this._lastBlock.height - this.block_info.height;
    }
    return 0;
  }
  private _lastBlock?: SingleBlockModel;
  @ChainBlockDetailPage.addEvent("HEIGHT:CHANGED")
  watchHeightChanged() {
    this.blockService.lastBlock.getPromise().then(lastBlock => {
      this._lastBlock = lastBlock;
    });
  }
  delegate_info?: DelegateModel;
  @asyncCtrlGenerator.error()
  async loadDelegateInfo() {
    if (
      this.block_info &&
      this.block_info.height !== 1 /*创世块账户不是受托人*/
    ) {
      this.delegate_info = await this.minService.getDelegateInfo(
        this.block_info.generatorPublicKey
      );
    }
  }

  @asyncCtrlGenerator.error(() =>
    ChainBlockDetailPage.getTranslate("LOAD_TRANSACTION_LIST_ERROR")
  )
  // @asyncCtrlGenerator.loading(() =>
  //   ChainBlockDetailPage.getTranslate("LOADING_TRANSACTION_LIST"), undefined, {
  //     showBackdrop: false
  //   }
  // )
  async loadTranLogs() {
    const { block_info, tran_list_config } = this;
    // 重置page
    tran_list_config.page = 1;
    const transaction_list = await this._loadTranLogs();
    this.tran_list = transaction_list;
  }
  async _loadTranLogs() {
    const { block_info, tran_list_config } = this;
    if (!block_info) {
      return [];
    }
    tran_list_config.loading = true;
    try {
      // 重置page
      const transaction_list = await this.blockService.getTransactionsInBlock(
        block_info.id,
        tran_list_config.page,
        tran_list_config.pageSize
      );
      tran_list_config.has_more =
        transaction_list.length === tran_list_config.pageSize;
      return this.localContact.formatTransactionWithLoclContactNickname(
        transaction_list
      );
    } finally {
      tran_list_config.loading = false;
    }
  }

  @asyncCtrlGenerator.error("@@LOAD_MORE_TRANSACTION_LIST_ERROR")
  async loadMoreTranLogs() {
    const { block_info, tran_list_config, tran_list } = this;

    tran_list_config.page += 1;
    const transaction_list = await this._loadTranLogs();
    tran_list.push(...transaction_list);
  }

  @asyncCtrlGenerator.loading()
  async toPerBlock() {
    if (this.block_info) {
      return this.initAndLoadData(this.block_info.previousBlock);
    }
  }
}
