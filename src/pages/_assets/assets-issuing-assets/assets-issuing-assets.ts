import { ViewChild, Component, Optional, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { sleep } from "../../../bnqkl-framework/PromiseExtends";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { fileInputEleFactory } from "../../../bnqkl-framework/helper";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams, ViewController } from "ionic-angular";
import { BlockServiceProvider, SingleBlockModel } from "../../../providers/block-service/block-service";
import { AssetsServiceProvider } from "../../../providers/assets-service/assets-service";
import { MatAutocomplete } from "@angular/material";
import { formatImage } from "../../../components/AniBase";
import { TransactionServiceProvider } from "../../../providers/transaction-service/transaction-service";

import { PwdInputPage } from "../../pwd-input/pwd-input";

@IonicPage({ name: "assets-issuing-assets" })
@Component({
  selector: "page-assets-issuing-assets",
  templateUrl: "assets-issuing-assets.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetsIssuingAssetsPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public cdRef: ChangeDetectorRef,
    public viewCtrl: ViewController,
    public blockService: BlockServiceProvider,
    public assetsService: AssetsServiceProvider,
    public transactionService: TransactionServiceProvider,
    public domSanitizer: DomSanitizer
  ) {
    super(navCtrl, navParams, true, tabs);
    this.event.on("job-finished", async ({ id, data }) => {
      console.log("job-finished", id, data);
      if (id === "pay-select-my-contacts" || id === "pay-select-my-local-contacts") {
        this.formData.genesisAddress = data.address;
        this.markForCheck();
      }
      if (id === "assets-logo-clip") {
        if (data && data.logo_url) {
          this.formData.logo = data.logo_url;
          this.markForCheck();
        }
      }
    });
  }
  formData: {
    logo: string;
    abbreviation: string;
    genesisAddress: string;
    expectedIssuedAssets?: number;
    // expectedIssuedBlockHeight?: number;
    pwd: string;
    need_pay_pwd: boolean;
    pay_pwd: string;
    fee: number;
  } = {
    logo: "",
    abbreviation: "",
    genesisAddress: "",
    expectedIssuedAssets: undefined,

    pwd: "",
    need_pay_pwd: this.userInfo.hasSecondPwd,
    pay_pwd: "",
    fee: parseFloat(this.appSetting.settings.default_fee),
    // expectedIssuedBlockHeight: undefined,
  };

  ignore_keys = ["logo", "pay_pwd"];
  summary_maxlength = 200;

  @asyncCtrlGenerator.error("@@FEE_INPUT_ERROR")
  async setFee() {
    const { custom_fee } = await this.getCustomFee(this.formData.fee);
    this.formData.fee = custom_fee;
    this.markForCheck();
  }

  /// 表单校验
  /**校验数字资产英文简写*/
  @AssetsIssuingAssetsPage.setErrorTo("errors", "abbreviation", ["TOO_SHORT", "TOO_LONG", "WRONG_CHAR"])
  check_abbreviation() {
    const res: any = {};
    const { abbreviation } = this.formData;
    if (abbreviation) {
      if (abbreviation.length < 3) {
        res.TOO_SHORT = "ABBREVIATION_TOO_SHORT";
      } else if (abbreviation.length > 5) {
        res.TOO_LONG = "ABBREVIATION_TOO_LONG";
      }
      for (var i = 0; i < abbreviation.length; i += 1) {
        if (!/[a-zA-Z]/.test(abbreviation[i])) {
          res.WRONG_CHAR = "ABBREVIATION_WRONG_CHAR";
          break;
        }
      }
    }
    return res;
  }
  /**校验数字接受地址简写*/
  @AssetsIssuingAssetsPage.setErrorTo("errors", "genesisAddress", ["WRONG_ADDRESS"])
  check_genesisAddress() {
    const res: any = {};
    const { genesisAddress } = this.formData;
    if (genesisAddress === this.userInfo.address) {
      res.WRONG_ADDRESS = "GENESIS_DESTINATION_CAN_NOT_BE_YOURSELF";
    } else if (!this.transactionService.isAddressCorrect(genesisAddress)) {
      res.WRONG_ADDRESS = "GENESIS_ADDRESS_IS_MALFORMED";
    }
    return res;
  }
  /**校验资产发行数量*/
  @AssetsIssuingAssetsPage.setErrorTo("errors", "expectedIssuedAssets", ["WRONG_RANGE"])
  check_expectedIssuedAssets() {
    const res: any = {};
    const { expectedIssuedAssets } = this.formData;
    if (expectedIssuedAssets) {
      if (expectedIssuedAssets <= 0) {
        res.WRONG_RANGE = "expectedIssuedAssets_RANGE_ERROR";
      }
    }
    // this.calcRate();
    return res;
  }

  /**校验支付密码*/
  @AssetsIssuingAssetsPage.setErrorTo("errors", "pay_pwd", ["VerificationFailure", "NeedInput"])
  check_pay_pwd() {
    if (this.formData.pay_pwd) {
      if (!this.transactionService.verifySecondPassphrase(this.formData.pay_pwd)) {
        return {
          VerificationFailure: "PAY_PWD_VERIFICATION_FAILURE",
        };
      }
    }
  }

  @AssetsIssuingAssetsPage.markForCheck lastBlock: SingleBlockModel = { height: 1, timestamp: 0, id: "", magic: "" };

  /**选择资产logo图片*/
  pickAssetsLogo() {
    const inputEle = fileInputEleFactory("pickAssetsLogoPicker");
    inputEle.value = "";
    const clickEvent = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    inputEle.onchange = e => {
      if (inputEle.files && inputEle.files[0]) {
        const clip_dialog = this.modalCtrl.create("assets-logo-clip", {
          logo_url: URL.createObjectURL(inputEle.files[0]),
          auto_return: true,
        });
        clip_dialog.present();
        clip_dialog.onWillDismiss(data => {
          if (data && data.logo_url) {
            this.formData.logo = data.logo_url;
            this.markForCheck();
            inputEle.value = "";
          }
        });
        // this.formData.logo = URL.createObjectURL(inputEle.files[0]);
      } else {
        console.log("没有选择文件，代码不应该运行到这里");
      }
    };
    inputEle.dispatchEvent(clickEvent);
  }

  /**申请成为受托人*/
  @asyncCtrlGenerator.error()
  @asyncCtrlGenerator.success()
  async applyToAsDelegate() {
    const { custom_fee, password, pay_pwd } = await this.getUserPassword({
      custom_fee: true,
    });
    await this._sendToDelegateTx((custom_fee || this.appSetting.settings.default_fee).toString(), password, pay_pwd);
  }
  @asyncCtrlGenerator.loading()
  private async _sendToDelegateTx(fee: string, secret: string, secondSecret?: string) {
    await this.transactionService.putTransaction({
      type: this.transactionService.TransactionTypes.DELEGATE,
      secondSecret,
      secret,
      publicKey: this.userInfo.publicKey,
      fee,
      asset: {
        delegate: {
          ...(this.userInfo.username ? { username: this.userInfo.username } : {}),
          publicKey: this.userInfo.publicKey,
        },
      },
    });
  }

  /**数字转大写*/
  DX(n) {
    if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(n)) return "数据非法";
    var unit = "千百拾亿千百拾万千百拾個",
      str = "";
    // n += "00";
    // var p = n.indexOf(".");
    // if (p >= 0) n = n.substring(0, p) + n.substr(p + 1, 2);
    n = parseInt(n) || 0;
    n += "";
    unit = unit.substr(unit.length - n.length);
    for (var i = 0; i < n.length; i++) str += "零壹贰叁肆伍陆柒捌玖"[n[i]] + unit[i];
    return str
      .replace(/零(千|百|拾|角)/g, "零")
      .replace(/(零)+/g, "零")
      .replace(/零(万|亿|個)/g, "$1")
      .replace(/(亿)万|壹(拾)/g, "$1$2")
      .replace(/^個零?|零分/g, "")
      .replace(/個$/g, "個整");
  }

  get canSubmit() {
    const canSubmit = super.canSubmit;
    if (canSubmit) {
      if (this.formData.need_pay_pwd) {
        return !!this.formData.pay_pwd;
      }
    }
    return canSubmit;
  }

  private _cache_logo_base64 = ["", ""];
  /**提交数字资产表单*/
  @asyncCtrlGenerator.single()
  @asyncCtrlGenerator.error()
  @asyncCtrlGenerator.success()
  async submit() {
    const { formData, _cache_logo_base64 } = this;
    if (!formData.logo) {
      await this.showWarningDialog(await this.translateMessage("@@PLEASE_PICK_AN_IMAGE_AS_ASSETS_LOGO"));
      return;
    }
    if (_cache_logo_base64[0] !== formData.logo) {
      _cache_logo_base64[0] = formData.logo;
      _cache_logo_base64[1] = await this.assetsService.imageUrlToJpegBase64(formData.logo, true);
    }

    await this.assetsService.addAssets(
      {
        sourceMagic: await this.blockService.magic.promise,
        logo: _cache_logo_base64[1],
        abbreviation: formData.abbreviation.toUpperCase(),
        genesisAddress: formData.genesisAddress,
        expectedIssuedAssets: formData.expectedIssuedAssets as number,
      },
      this.formData.fee,
      this.formData.pwd,
      this.formData.pay_pwd
    );

    this.finishJob();
  }
}
