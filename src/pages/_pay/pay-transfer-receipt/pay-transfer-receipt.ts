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
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  domtoimage = domtoimage;
  @ViewChild("transferReceiptEle") transferReceiptEle!: ElementRef;
  @ViewChild(CommonWaveBgComponent) wages!: CommonWaveBgComponent;
  /* 回执 */
  current_transfer?: TransactionModel;
  @PayTransferReceiptPage.willEnter
  initData() {
    const transfer = this.navParams.get("transfer");
    if (!transfer) {
      return this.navCtrl.goToRoot({});
    }
    this.current_transfer = transfer;
  }

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
        width: tr.clientWidth,
        height: tr.clientHeight,
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
