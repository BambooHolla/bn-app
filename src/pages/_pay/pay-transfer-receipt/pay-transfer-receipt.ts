import { Component, Optional, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  Refresher,
  Content,
  ViewController,
} from "ionic-angular/index";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import {
  TransactionServiceProvider,
  TransactionTypes,
  TransactionModel,
} from "../../../providers/transaction-service/transaction-service";
import { BlockServiceProvider } from "../../../providers/block-service/block-service";
import { CommonWaveBgComponent } from "../../../components/common-wave-bg/common-wave-bg";
import { TransferReceiptComponent } from "../../../components/transfer-receipt/transfer-receipt";

import { Screenshot } from "@ionic-native/screenshot";
import { SocialSharing } from "@ionic-native/social-sharing";
import domtoimage from "dom-to-image";

@IonicPage({ name: "pay-transfer-receipt" })
@Component({
  selector: "page-pay-transfer-receipt",
  templateUrl: "pay-transfer-receipt.html",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayTransferReceiptPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public transactionService: TransactionServiceProvider,
    @Optional() public tabs: TabsPage,
    public screenshot: Screenshot,
    public socialSharing: SocialSharing,
    public viewCtrl: ViewController,
    public blockService: BlockServiceProvider,
    public cdRef: ChangeDetectorRef,
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  domtoimage = domtoimage;
  @ViewChild("transferReceiptEle") transferReceipt!: TransferReceiptComponent;
  @ViewChild(CommonWaveBgComponent) wages!: CommonWaveBgComponent;
  /* 回执 */
  @PayTransferReceiptPage.markForCheck current_transfer?: TransactionModel;
  @PayTransferReceiptPage.willEnter
  async initData() {
    const transfer = this.navParams.get("transfer") as TransactionModel;
    if (!transfer) {
      return this.navCtrl.goToRoot({});
    }
    this.current_transfer = transfer;
  }
  @PayTransferReceiptPage.detectChanges is_rendered = false;
  onRendered(trs: TransactionModel) {
    this.current_transfer = trs;
    this.is_rendered = true;
  }

  @asyncCtrlGenerator.loading("@@GENERATING_CAPTURE")
  @asyncCtrlGenerator.success("@@CAPTURE_GENERATE_SUCCESS")
  @asyncCtrlGenerator.single()
  async  capture() {
    this.is_screenshotting = true;
    try {
      return await this.transferReceipt.exportClipBolbUrl();
    } finally {
      this.is_screenshotting = false;
    }
  }

  is_screenshotting = false;
  capture_uri?: string;
  @asyncCtrlGenerator.error("@@SHARE_ERROR")
  async share() {
    if (!this.capture_uri) {
      console.time("capture");
      const res = await this.capture();
      console.timeEnd("capture");
      this.capture_uri = res;
    }
    const share_res = await this.socialSharing.share(
      undefined,
      undefined,
      this.capture_uri
    );
    console.log(share_res);
  }
  closeModal() {
    return this.viewCtrl.dismiss();
  }
}
