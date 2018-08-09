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
  }
  formData: {
    logo: string;
    abbreviation: string;
    genesisAddress: string;
    expectedIssuedAssets?: number;
    expectedIssuedBlockHeight?: number;
  } = {
    logo: "",
    abbreviation: "",
    genesisAddress: "",
    expectedIssuedAssets: undefined,
    expectedIssuedBlockHeight: undefined,
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

  @AssetsIssuingAssetsPage.setErrorTo("errors", "expectedIssuedBlockHeight", [
    "WRONG_RANGE",
  ])
  check_expectedIssuedBlockHeight() {
    const res: any = {};
    const { expectedIssuedBlockHeight } = this.formData;
    if (expectedIssuedBlockHeight) {
      if (expectedIssuedBlockHeight <= this.appSetting.getHeight()) {
        res.WRONG_RANGE = "EXPECTEDISSUEDBLOCKHEIGHT_RANGE_ERROR";
      }
    }
    // this.calcRate();
    return res;
  }

  private _blockHeightTime_Lock_map = new Map<number, Promise<number>>();

  blockHeightTime(height = this.formData.expectedIssuedBlockHeight) {
    if (!height) {
      return;
    }
    const { lastBlock } = this;
    const diff_height = height - lastBlock.height;
    return (
      this.blockService.getFullTimestamp(lastBlock.timestamp) +
      diff_height * this.appSetting.BLOCK_UNIT_TIME
    );
  }
  @AssetsIssuingAssetsPage.markForCheck
  lastBlock: SingleBlockModel = { height: 1, timestamp: 0, id: "" };
  /*自动补全*/
  @AssetsIssuingAssetsPage.markForCheck
  expectedIssuedBlockHeightOptions: number[] = [];

  private _expectedIssuedBlockHeightOptions: number[] = [];
  @AssetsIssuingAssetsPage.addEventAfterDidEnter("HEIGHT:CHANGED")
  watchHeightChanged() {
    const height = this.appSetting.getHeight();
    /*7*24*60*60/128 = 4725*/
    const weakly_height =
      (7 * 24 * 60 * 60 * 1000) / this.appSetting.BLOCK_UNIT_TIME;
    // 一个季度的时间，3月*4周
    this._expectedIssuedBlockHeightOptions = Array.from({ length: 12 }).map(
      (_, i) => height + weakly_height * (i + 1)
    );

    this.blockService.lastBlock.getPromise().then(b => {
      this.lastBlock = b;
    });
    // 校验范围
    this.check_expectedIssuedBlockHeight();
  }
  @ViewChild("autoExpectedIssuedBlockHeight") autoHeight!: MatAutocomplete;

  @AssetsIssuingAssetsPage.didEnter
  init_delaySetHeightOptions() {
    let show_options_ti;
    this.event.on("input-status-changed", ({ key: formKey, event: e }) => {
      if (formKey !== "expectedIssuedBlockHeight") {
        return;
      }
      if (e.type === "focus") {
        clearTimeout(show_options_ti);
        show_options_ti = setTimeout(() => {
          this._delaySetHeightOptions();
        }, 500);
      } else if (e.type === "blur") {
        clearTimeout(show_options_ti);
        show_options_ti = setTimeout(() => {
          this._delayUnSetHeightOptions();
        }, 500);
      }
    });
  }
  private _delaySetHeightOptions() {
    this.expectedIssuedBlockHeightOptions = this._expectedIssuedBlockHeightOptions;
  }
  private _delayUnSetHeightOptions() {
    this.expectedIssuedBlockHeightOptions = [];
  }
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
    inputEle.dispatchEvent(clickEvent);
    inputEle.onchange = e => {
      if (inputEle.files && inputEle.files[0]) {
        this.formData.logo = URL.createObjectURL(inputEle.files[0]);
        this.markForCheck();
      } else {
        console.log("没有选择文件，代码不应该运行到这里");
      }
    };
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
        expectedIssuedBlockHeight: formData.expectedIssuedBlockHeight as number,
      },
      custom_fee,
      password,
      pay_pwd
    );

    this.finishJob();
  }
}
