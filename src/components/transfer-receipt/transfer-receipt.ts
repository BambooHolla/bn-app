import {
  Component,
  ViewChild,
  ElementRef,
  Input,
  Output,
  OnDestroy,
  EventEmitter,
} from "@angular/core";
import { AniBase } from '../AniBase';
import { PromiseOut, DelayPromise } from "../../bnqkl-framework/PromiseExtends";
import { tryRegisterGlobal, baseConfig } from "../../bnqkl-framework/helper";
import { TransactionModel } from "../../providers/transaction-service/transaction.types";
import debug from "debug";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { FLP_Tool } from "../../bnqkl-framework/FLP_Tool";
import * as moment from "moment";
import { CssLike, CssLikeStyle } from "../CssLike";
import { AppSettingProvider } from "../../providers/app-setting/app-setting"
import { Subscription } from "rxjs/Subscription";
import { BlockServiceProvider } from "../../providers/block-service/block-service";
import { TransactionServiceProvider } from "../../providers/transaction-service/transaction-service";
import * as deepEqual from "fast-deep-equal";

const log = debug("IBT:transfer-receipt");

/// 加载资源
export const loader = new PIXI.loaders.Loader();
loader.use(function (resource: PIXI.loaders.Resource, next) {
  if (resource.url.endsWith(".js")) {
    // PIXI.loaders.Loader.
    resource.data = CssLike.complieStyleFromScript(resource.data);
  }
  next();
});
loader.add("header_bg", "assets/imgs/pay-transfer-receipt/bg.jpg");
loader.add("disbaled_progress_dot", "assets/imgs/pay-transfer-receipt/disbaled-progress-dot.png");
loader.add("stamp", "assets/imgs/pay-transfer-receipt/章.png");
loader.add("enable_light", "assets/imgs/pay-transfer-receipt/progress-dot.png");
loader.add("disabled_light", "assets/imgs/pay-transfer-receipt/disbaled-progress-dot.png");
loader.add("progress_dark_line", "assets/imgs/pay-transfer-receipt/progress-dark-line.png");
loader.add("progress_light_line", "assets/imgs/pay-transfer-receipt/progress-light-line.png");
loader.add("style", "assets/csslike/transfer-receipt.js");

export const _load_resource_delaypromise = new DelayPromise<
  PIXI.loaders.ResourceDictionary
  >((resolve, reject) => {
    loader.load((loader, resources) => resolve(resources));
    loader.onError.add(reject);
  });

/**比例 */
const RECEIPT_W = 633;
const RECEIPT_H = 841;


@Component({
  selector: 'transfer-receipt',
  templateUrl: 'transfer-receipt.html'
})
export class TransferReceiptComponent extends CssLike implements OnDestroy {
  @ViewChild("canvas") canvasRef!: ElementRef;
  _init() {
    this.canvasNode = this.canvasRef.nativeElement;
    return super._init();
  }

  private _transaction?: TransactionModel;
  @Input("transaction")
  set transaction(v) {
    if (v !== this._transaction) {
      this._transaction = v;
      log("draw tick %O", v);
      this.drawTransaction(v);
      if (v && !v.blockId) {// 未确定的情况下，进行监听
        this.watchTransaction();
      } else {
        this.unwatchTransaction();
      }
    }
  }
  get transaction() {
    return this._transaction;
  }
  @Output("rendered")
  rendered = new EventEmitter<TransactionModel>();

  constructor(
    public appSetting: AppSettingProvider,
    public blockService: BlockServiceProvider,
    public transactionService: TransactionServiceProvider,
  ) {
    super();
    tryRegisterGlobal("transferReceiptDrawer", this);
    tryRegisterGlobal("tt", this);
    this.on("init-start", this.initPixiApp.bind(this));
  }
  async initPixiApp() {
    const { pt, px, canvasNode } = this;
    if (!canvasNode) {
      throw new Error("call init first");
    }
    if (!this.app) {
      // // todo:use parentElement width and height
      // let { clientWidth, clientHeight } = document.body;
      // // canvasNode.parentElement || canvasNode;

      // // contain模式
      // if (clientWidth / clientHeight > RECEIPT_W / RECEIPT_H) {
      //   clientWidth = (RECEIPT_W / RECEIPT_H) * clientHeight;
      // } else {
      //   clientHeight = (RECEIPT_H / RECEIPT_W) * clientWidth;
      // }
      this.app = this.PIXIAppbuilder({
        antialias: true,
        transparent: false,
        backgroundColor: 0xffffff,
        view: canvasNode,
        // height: pt(clientHeight),
        // width: pt(clientWidth),
        width: RECEIPT_W,
        height: RECEIPT_H,
        autoStart: true,
      });
    }
    if (this.transaction) {
      return this.drawTransaction(this.transaction);
    }
  }
  /**绘制交易 */
  @asyncCtrlGenerator.queue()
  async drawTransaction(trs?: TransactionModel) {
    const resources = await _load_resource_delaypromise;
    const { app } = this;
    if (!app) {
      return;
    }
    const { stage, renderer } = app;
    if (!trs) {
      return stage.visible = false
    }
    stage.visible = true;
    // // 开始绘制
    // this._drawRecipt(trs, stage, renderer, resources);

    // 获取相关的时间信息
    await this._updateTransferTimeInfo(trs);
    // 开始绘制
    this._drawRecipt(trs, stage, renderer, resources);
    this.rendered.emit(trs);
  }

  private _drawRecipt(trs: TransactionModel, stage: PIXI.Container, renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer, resources: PIXI.loaders.ResourceDictionary) {
    const transferReciptStyle: {
      [key: string]: CssLikeStyle
    } = resources.style.data;
    const { width: W, height: H } = renderer;
    // 销毁所有子元素，重新绘制
    stage.children.slice().forEach(c => c.destroy());
    /// 白色背景
    const bg = new PIXI.Graphics();
    {
      bg.beginFill(0xffffff);
      bg.drawRect(0, 0, W, H);
      bg.endFill();
      stage.addChild(bg);
    }
    /// 头部贴图
    const header_bg = new PIXI.Sprite(resources.header_bg.texture);
    {
      // 等比缩放
      const rate = W / header_bg.width;
      header_bg.scale.set(rate, rate);
      bg.addChild(header_bg);
    }
    /// 头部文字
    const h_title = new PIXI.Text();
    {
      h_title.text = FLP_Tool.getTranslateSync("TRANSFER_OF_#ASSETTYPE#", {
        assetType: (trs.assetType || "IBT")
      });
      bg.addChild(h_title);
      /// 绑定样式
      this.effectStyle(h_title, transferReciptStyle.h_title_style);
    }
    /// 转账数量
    const h_mid = new PIXI.Container();
    {
      bg.addChild(h_mid);

      // left
      const left = new PIXI.Text();
      left.text = "\ue66a"; // ifm-iconfontyue3eps
      h_mid.addChild(left);

      // center
      const center = new PIXI.Text();
      center.text = (parseFloat(trs.amount) / 1e8).toFixed(8);
      h_mid.addChild(center);

      // right
      const right = new PIXI.Text();
      right.text = trs.assetType || "IBT";
      h_mid.addChild(right);

      /// 绑定样式
      this.effectStyle(left, transferReciptStyle.h_mid_left_style);
      this.effectStyle(center, transferReciptStyle.h_mid_center_style);
      this.effectStyle(right, transferReciptStyle.h_mid_right_style);
      this.effectStyle(h_mid, transferReciptStyle.h_mid_style);
    }

    /// 接收人信息
    const h_btm = new PIXI.Container();
    {
      bg.addChild(h_btm);

      // left
      const left = new PIXI.Text();
      left.text = FLP_Tool.getTranslateSync("TRANSCATION_RECIPIENT");
      h_btm.addChild(left);

      // right
      const right = new PIXI.Text();
      right.text = trs.recipientId;
      h_btm.addChild(right);

      /// 绑定样式
      this.effectStyle(left, transferReciptStyle.h_btm_left_style);
      this.effectStyle(right, transferReciptStyle.h_btm_right_style);
      this.effectStyle(h_btm, transferReciptStyle.h_btm_style);
    }

    /// 时间
    const h_time = new PIXI.Container();
    {
      bg.addChild(h_time);

      // left
      const left = new PIXI.Text();
      left.text = "\ue610"; // ifm-clock
      h_time.addChild(left);

      // right
      const right = new PIXI.Text();
      right.text = moment(trs.dateCreated).format("YYYY-MM-DD HH:mm:ss")
      h_time.addChild(right);

      /// 绑定样式
      this.effectStyle(left, transferReciptStyle.h_time_left_style);
      this.effectStyle(right, transferReciptStyle.h_time_right_style);
      this.effectStyle(h_time, transferReciptStyle.h_time_style);
    }

    /// 切割线
    const line_1 = new PIXI.Graphics();
    line_1.lineStyle(0.00115 * H/* 1.65 px */, 0xeeeeee);
    line_1.moveTo(W * 0.06, 0);
    line_1.lineTo(W * (1 - 0.06), 0);
    line_1.position.y = 0.4592 * H;
    bg.addChild(line_1);

    const line_2 = new PIXI.Graphics();
    line_2.lineStyle(0.00115 * H/* 1.65 px */, 0xeeeeee);
    line_2.moveTo(W * 0.06, 0);
    line_2.lineTo(W * (1 - 0.06), 0);
    line_2.position.y = 0.5827 * H;
    bg.addChild(line_2);

    /// 支付人
    const c_payer = new PIXI.Container();
    {
      bg.addChild(c_payer);

      // label
      const label = new PIXI.Text();
      label.text = FLP_Tool.getTranslateSync("PAYER");
      c_payer.addChild(label);

      // content
      const content = new PIXI.Text();
      content.text = trs.senderId;
      c_payer.addChild(content);

      /// 绑定样式
      this.effectStyle(label, transferReciptStyle.c_payer_label_style);
      this.effectStyle(content, transferReciptStyle.c_payer_content_style);
      this.effectStyle(c_payer, transferReciptStyle.c_payer_style);
    }
    /// 手续费
    const c_fee = new PIXI.Container();
    {
      bg.addChild(c_fee);

      // label
      const label = new PIXI.Text();
      label.text = FLP_Tool.getTranslateSync("FEE");
      c_fee.addChild(label);

      // content
      const content = new PIXI.Text();
      content.text = (parseFloat(trs.fee) / 1e8).toFixed(8);
      c_fee.addChild(content);

      const unit = new PIXI.Text("IBT");
      c_fee.addChild(unit);

      /// 绑定样式
      this.effectStyle(label, transferReciptStyle.c_fee_label_style);
      this.effectStyle(content, transferReciptStyle.c_fee_content_style);
      this.effectStyle(unit, transferReciptStyle.c_fee_unit_style);
      this.effectStyle(c_fee, transferReciptStyle.c_fee_style);
    }
    /// 交易ID
    const c_tid = new PIXI.Container();
    {
      bg.addChild(c_tid);

      // label
      const label = new PIXI.Text();
      label.text = FLP_Tool.getTranslateSync("TRANSACTION_ID");
      c_tid.addChild(label);

      // content
      const content = new PIXI.Text();
      content.text = trs.id.substr(0, 32) + "\n" + trs.id.substr(32);
      c_tid.addChild(content);

      /// 绑定样式
      this.effectStyle(label, transferReciptStyle.c_tid_label_style);
      this.effectStyle(content, transferReciptStyle.c_tid_content_style);
      this.effectStyle(c_tid, transferReciptStyle.c_tid_style);
    }

    /// 印章
    const stamp = new PIXI.Sprite(resources.stamp.texture);
    {
      stamp.blendMode = PIXI.BLEND_MODES.MULTIPLY;
      this.effectStyle(stamp, transferReciptStyle.stamp_style);
      bg.addChild(stamp);
    }

    /// 分割线
    const line_3 = new PIXI.Graphics();
    line_3.beginFill(0xeeeeee);
    line_3.drawRect(0, 0, W, H * 0.024);
    line_3.endFill();
    line_3.position.y = 0.735 * this.H;
    bg.addChild(line_3);

    /// 时间线
    const f_submitd_expected_line = new PIXI.extras.TilingSprite(resources.progress_light_line.texture);
    {
      this.effectStyle(f_submitd_expected_line, transferReciptStyle.f_submitd_expected_line_style);
      bg.addChild(f_submitd_expected_line);
    }

    const f_submitd = new PIXI.Container();
    {
      const light = new PIXI.Sprite(resources.enable_light.texture);
      const time = new PIXI.Text(moment(trs.dateCreated).format("HH:mm"));
      const label = new PIXI.Text(FLP_Tool.getTranslateSync("CONFIRMED_TIME"));

      f_submitd.addChild(light);
      f_submitd.addChild(time);
      f_submitd.addChild(label);
      bg.addChild(f_submitd);

      /// 绑定样式
      this.effectStyle(light, transferReciptStyle.f_submitd_light_style);
      this.effectStyle(time, transferReciptStyle.f_submitd_time_style);
      this.effectStyle(label, transferReciptStyle.f_submitd_label_style);
      this.effectStyle(f_submitd, transferReciptStyle.f_submitd_style);
    }
    const f_expected = new PIXI.Container();
    {
      const light = new PIXI.Sprite(trs.blockId ? resources.enable_light.texture : resources.disabled_light.texture);
      const time = new PIXI.Text(moment(trs.blockId ? this.confirmed_timestamp : this.expected_confirmation_time).format("HH:mm"));
      const label = new PIXI.Text(FLP_Tool.getTranslateSync(trs.blockId ? "CONFIRMED_TIME" : "EXPECTED_CONFIRMATION_TIME"));

      f_submitd.addChild(light);
      f_submitd.addChild(time);
      f_submitd.addChild(label);
      bg.addChild(f_expected);

      /// 绑定样式
      this.effectStyle(light, transferReciptStyle.f_expected_light_style);
      this.effectStyle(time, transferReciptStyle.f_expected_time_style);
      this.effectStyle(label, transferReciptStyle.f_expected_label_style);
      this.effectStyle(f_expected, transferReciptStyle.f_expected_style);
    }

    this.forceRenderOneFrame();
  }

  ///
  trs_sub?: Subscription
  /**订单状态的监听 */
  watchTransaction() {
    this.unwatchTransaction();
    this.trs_sub = this.appSetting.height.subscribe(async () => {
      const old_trs = this._transaction;
      if (old_trs) {
        try {
          const new_trs = await this.transactionService.getTransactionById(old_trs.id);
          if (this._isNeedResetWatch(new_trs)) {
            this.transaction = new_trs;
          }
        } catch (err) {
          console.log("交易未确认", err)
        }
      }
    });
  }
  private unwatchTransaction() {
    if (this.trs_sub) {
      this.trs_sub.unsubscribe();
      this.trs_sub = undefined;
    }
  }
  private _isNeedResetWatch(trs: TransactionModel) {
    return !!trs.blockId;
  }
  /**已经确认的时间 */
  confirmed_timestamp = 0;
  /**预计确认时间 */
  expected_confirmation_time = 0;

  private async _updateTransferTimeInfo(transfer: TransactionModel) {
    if (transfer.blockId) {
      this.confirmed_timestamp = (await this.blockService.getBlockById(
        transfer.blockId
      )).timestamp;
      this.unwatchTransaction();
    } else {
      const BLOCK_UNIT_TIME = baseConfig.BLOCK_UNIT_TIME;
      let diff_time = await this.blockService.getLastBlockRefreshInterval();
      diff_time %= BLOCK_UNIT_TIME;
      this.expected_confirmation_time =
        Date.now() + BLOCK_UNIT_TIME - diff_time;
    }
  }

  /**销毁监听 */
  ngOnDestroy() {
    this.unwatchTransaction();
  }

  /**导出成图片 */
  exportBase64() {
    const { app } = this;
    if (!app) {
      return
    }
    const export_base64 = app.renderer.extract.base64();
    return export_base64;
  }
  exportBolb() {
    const export_base64 = this.exportBase64();
    if (!export_base64) {
      return;
    }
    const contentType = "image/png";
    const sliceSize = /*sliceSize || */ 512;
    const b64Data = export_base64.split(",")[1];
    const byteCharacters = atob(b64Data);
    const byteArrays: Uint8Array[] = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      byteArrays.push(new Uint8Array(byteNumbers));
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }
  async exportClipBolbUrl() {
    return URL.createObjectURL(this.exportBolb());
  }
}
