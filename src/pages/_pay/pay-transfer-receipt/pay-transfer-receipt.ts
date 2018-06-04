import { Component, Optional, ViewChild, ElementRef } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  Refresher,
  Content,
  ViewController,
} from "ionic-angular";
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

import { Screenshot } from "@ionic-native/screenshot";
import { SocialSharing } from "@ionic-native/social-sharing";
import domtoimage from "dom-to-image";

@IonicPage({ name: "pay-transfer-receipt" })
@Component({
  selector: "page-pay-transfer-receipt",
  templateUrl: "pay-transfer-receipt.html",
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
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  domtoimage = domtoimage;
  @ViewChild("transferReceiptEle") transferReceiptEle!: ElementRef;
  @ViewChild(CommonWaveBgComponent) wages!: CommonWaveBgComponent;
  /* 回执 */
  current_transfer?: TransactionModel;
  @PayTransferReceiptPage.willEnter
  async initData() {
    const transfer = this.navParams.get("transfer") as TransactionModel;
    if (!transfer) {
      return this.navCtrl.goToRoot({});
    }
    this.current_transfer = transfer;
    if (transfer.blockId) {
      this.confirmed_timestamp = (await this.blockService.getBlockById(
        transfer.blockId,
      )).timestamp;
    } else {
      const BLOCK_UNIT_TIME = this.appSetting.BLOCK_UNIT_TIME;
      let diff_time = await this.blockService.getLastBlockRefreshInterval();
      diff_time %= BLOCK_UNIT_TIME;

      this.expected_confirmation_time =
        Date.now() + BLOCK_UNIT_TIME - diff_time;
    }
  }
  confirmed_timestamp = 0;
  expected_confirmation_time = 0;

  @asyncCtrlGenerator.loading(() =>
    PayTransferReceiptPage.getTranslate("GENERATING_CAPTURE"),
  )
  @asyncCtrlGenerator.success(() =>
    PayTransferReceiptPage.getTranslate("CAPTURE_GENERATE_SUCCESS"),
  )
  async capture() {
    this.is_screenshotting = true;
    try {
      const tr = this.transferReceiptEle.nativeElement;
      const t = tr.style.transform;
      tr.style.transform = "scale(1)";
      const toimage_promise = this.domtoimage.toJpeg(tr, {
        width: tr.clientWidth * window.devicePixelRatio,
        height: tr.clientHeight * window.devicePixelRatio,
      });
      this.raf(() => {
        tr.style.transform = t;
      });
      return toimage_promise;
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
      // const res = await this.screenshot.URI(80);
      const res = await this.capture();
      console.timeEnd("capture");
      // console.log(res);
      this.capture_uri = res;
    }
    const share_res = await this.socialSharing.share(
      undefined,
      undefined,
      this.capture_uri,
    );
    console.log(share_res);
  }
  closeModal() {
    return this.viewCtrl.dismiss();
  }
}
