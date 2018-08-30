import {
  ViewChild,
  Component,
  Optional,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { sleep } from "../../../bnqkl-framework/PromiseExtends";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
} from "ionic-angular";
import {
  BlockServiceProvider,
  SingleBlockModel,
} from "../../../providers/block-service/block-service";
import { AssetsServiceProvider } from "../../../providers/assets-service/assets-service";
import { MatAutocomplete } from "@angular/material";
import { formatImage } from "../../../components/AniBase";
import { TransactionServiceProvider } from "../../../providers/transaction-service/transaction-service";

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
      if (
        id === "pay-select-my-contacts" ||
        id === "pay-select-my-local-contacts"
      ) {
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
  } = {
    logo: "",
    abbreviation: "",
    genesisAddress: "",
    expectedIssuedAssets: undefined,
    // expectedIssuedBlockHeight: undefined,
  };

  ignore_keys = ["logo"];
  summary_maxlength = 200;

  // 表单校验
  @AssetsIssuingAssetsPage.setErrorTo("errors", "abbreviation", [
    "TOO_SHORT",
    "TOO_LONG",
    "WRONG_CHAR",
  ])
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
  @AssetsIssuingAssetsPage.setErrorTo("errors", "genesisAddress", [
    "WRONG_ADDRESS",
  ])
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

  @AssetsIssuingAssetsPage.setErrorTo("errors", "expectedIssuedAssets", [
    "WRONG_RANGE",
  ])
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

  @AssetsIssuingAssetsPage.markForCheck
  lastBlock: SingleBlockModel = { height: 1, timestamp: 0, id: "" };

  /**选择资产logo图片*/
  pickAssetsLogo() {
    const inputEle = document.createElement("input");
    inputEle.type = "file";
    inputEle.accept = "image/*";
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
    await this._sendToDelegateTx(
      (custom_fee || this.appSetting.settings.default_fee).toString(),
      password,
      pay_pwd
    );
  }
  @asyncCtrlGenerator.loading()
  private async _sendToDelegateTx(
    fee: string,
    secret: string,
    secondSecret?: string
  ) {
    await this.transactionService.putTransaction({
      type: this.transactionService.TransactionTypes.DELEGATE,
      secondSecret,
      secret,
      publicKey: this.userInfo.publicKey,
      fee,
      asset: {
        delegate: {
          ...(this.userInfo.username
            ? { username: this.userInfo.username }
            : {}),
          publicKey: this.userInfo.publicKey,
        },
      },
    });
  }

  private _cache_logo_base64 = ["", ""];
  /**提交数字资产表单*/
  @asyncCtrlGenerator.single()
  @asyncCtrlGenerator.error()
  @asyncCtrlGenerator.success()
  async submit() {
    const { formData, _cache_logo_base64 } = this;
    if (!formData.logo) {
      await this.showWarningDialog(
        await this.translateMessage("@@PLEASE_PICK_AN_IMAGE_AS_ASSETS_LOGO")
      );
      return;
    }
    if (_cache_logo_base64[0] !== formData.logo) {
      _cache_logo_base64[0] = formData.logo;
      _cache_logo_base64[1] = await this.assetsService.imageUrlToJpegBase64(
        formData.logo,
        true
      );
    }

    const { custom_fee, password, pay_pwd } = await this.getUserPassword({
      custom_fee: true,
    });

    await this.assetsService.addAssets(
      {
        logo: _cache_logo_base64[1],
        abbreviation: formData.abbreviation.toUpperCase(),
        genesisAddress: formData.genesisAddress,
        expectedIssuedAssets: formData.expectedIssuedAssets as number,
      },
      custom_fee,
      password,
      pay_pwd
    );

    this.finishJob();
  }
}
