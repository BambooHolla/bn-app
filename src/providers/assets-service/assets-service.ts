import { Injectable } from "@angular/core";
import {
  AppSettingProvider,
  AppUrl,
  HEIGHT_AB_Generator,
} from "../app-setting/app-setting";
import {
  TransactionServiceProvider,
  TransactionModel,
} from "../transaction-service/transaction-service";
import { AppFetchProvider } from "../app-fetch/app-fetch";
import { formatImage } from "../../components/AniBase";
import * as TYPE from "./assets.types";
export * from "./assets.types";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { AsyncBehaviorSubject } from "../../bnqkl-framework/RxExtends";

@Injectable()
export class AssetsServiceProvider {
  constructor(
    public appSetting: AppSettingProvider,
    public fetch: AppFetchProvider,
    public transactionService: TransactionServiceProvider,
    public domSanitizer: DomSanitizer
  ) {}
  readonly GET_ASSETS_POSSESSOR = this.appSetting.APP_URL(
    "/api/assets/assetsPossessor"
  );
  readonly GET_RETURN_IBTDETAILS = this.appSetting.APP_URL(
    "/api/assets/returnIBTDetails"
  );
  readonly GET_ASSETS = this.appSetting.APP_URL("/api/assets/");
  readonly ADD_ASSETS = this.appSetting.APP_URL("/api/assets/tx/issuedAsset");
  readonly DESTORY_ASSET = this.appSetting.APP_URL(
    "/api/assets/tx/destoryAsset"
  );
  readonly TRANSFER_ASSET = this.appSetting.APP_URL("/api/assets/tx");
  readonly DOWNLOAD_ASSETS_LOGO = this.appSetting.APP_URL(
    "/api/assets/downloadAssetsLogo"
  );

  readonly ibt_assets: TYPE.AssetsModelWithLogoSafeUrl = {
    transactionId: "",
    address: "",
    publicKey: "",
    rate: 1,
    /**英文缩写(unique)*/
    abbreviation: "IBT",
    /**初始冻结的 IBT 数量*/
    originalFrozenIBT: 0,
    /**初始发行的资产数量*/
    originalIssuedAssets: 0,
    /**剩余的 IBT 数量*/
    remainIBT: 0,
    /**剩余的资产数量*/
    remainAssets: 0,
    applyAssetBlockHeight: 0,
    expectedRaisedIBTs: 0,
    expectedIssuedBlockHeight: 0,
    status: TYPE.ASSETS_STATUS.SUCCESS,
    dateCreated: AppSettingProvider.seedDateTimestamp,

    logo_safe_url: this.domSanitizer.bypassSecurityTrustUrl(
      "./assets/imgs/assets/IBT-assets-logo.jpg"
    ),
  };

  private _formatAssetsToWithLogoSafeUrl(assets: TYPE.AssetsModel[]) {
    return assets.map(assets => {
      const { logo, ...rest_assets } = assets;
      if (logo) {
        const logo_blob = this.jpgBase64ToBlob(logo);
        return {
          ...rest_assets,
          logo_safe_url: this.domSanitizer.bypassSecurityTrustUrl(
            URL.createObjectURL(logo_blob)
          ),
        } as TYPE.AssetsModelWithLogoSafeUrl;
      }
      return rest_assets;
    });
  }

  /**获取资产*/
  async getAssets(query) {
    const data = await this.fetch.get<{ assets: TYPE.AssetsModel[] }>(
      this.GET_ASSETS,
      {
        search: query,
      }
    );
    return this._formatAssetsToWithLogoSafeUrl(data.assets);
  }

  my_assets_default_pageSize = 20;
  myAssetsList!: AsyncBehaviorSubject<TYPE.AssetsModelWithLogoSafeUrl[]>;
  @HEIGHT_AB_Generator("myAssetsList")
  myAssetsList_Executor(promise_pro) {
    // 初始化缓存100条，后面每个块更新增量缓存1条，最大缓存1000条数据
    return promise_pro.follow(
      this._getAssetsByAddress(this.appSetting.user.address, {
        offset: 0,
        limit: this.my_assets_default_pageSize,
        need_logo: 0,
      })
    );
  }

  async getAssetsByAddress(
    address: string,
    extends_query: { limit?: number; offset?: number } = {}
  ) {
    if (address === this.appSetting.user.address) {
      if (
        typeof extends_query.limit === "number" &&
        typeof extends_query.offset === "number"
      ) {
        const end = extends_query.offset + extends_query.limit;
        if (end <= this.my_assets_default_pageSize) {
          const my_assets_list = await this.myAssetsList.getPromise();
          return my_assets_list.slice(extends_query.offset, end);
        }
      }
    }
    return this._getAssetsByAddress(address, extends_query);
  }
  async _getAssetsByAddress(address: string, extends_query: object) {
    const data = await this.fetch.get<{ assets: TYPE.AssetsModel[] }>(
      this.GET_ASSETS,
      {
        search: {
          address,
          ...extends_query,
        },
      }
    );
    return this._formatAssetsToWithLogoSafeUrl(data.assets);
  }

  getAssetsLogoHttpUrl(abbreviation: string) {
    return this.DOWNLOAD_ASSETS_LOGO.toString({ abbreviation });
  }

  /**数字资产的图片必须是jpg*/
  jpgBase64ToBlob(b64Data: string) {
    const contentType = "image/jpg";
    var sliceSize = sliceSize || 512;

    const byteCharacters = atob(b64Data);
    const byteArrays: Uint8Array[] = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);

      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      var byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }
  /**将图片转成统一的格式,512*512的jpeg*/
  imageUrlToJpegBase64(url: string, onlyBase64Content: boolean) {
    return formatImage(url, {
      format: "image/jpeg",
      view_width: 128,
      view_height: 128,
      size: "cover",
      position: "center",
      target_encode: "base64",
      encoderOptions: 0.8,
      onlyBase64Content,
    }) as Promise<string>;
  }
  /**获取资产拥有者的列表*/
  async getAssetsOwnerList(query) {
    const data = await this.fetch.get<{
      possessors: TYPE.AssetsPossessorModel[];
    }>(this.GET_ASSETS_POSSESSOR, {
      search: query,
    });
    return data.possessors;
  }
  addAssets(
    assetsInfo: {
      rate: number;
      logo: string;
      abbreviation: string;
      originalIssuedAssets: number;
      expectedRaisedIBTs: number;
      expectedIssuedBlockHeight: number;
    },
    fee = parseFloat(this.appSetting.settings.default_fee),
    secret: string,
    secondSecret?: string,
    publicKey = this.appSetting.user.publicKey,
    address = this.appSetting.user.address
  ) {
    const txData: any = {
      type: this.transactionService.TransactionTypes.ISSUE_ASSET,
      secret,
      publicKey,
      fee,
      asset: {
        issueAsset: {
          address,
          publicKey,
          ...assetsInfo,
        },
      },
    };
    if (secondSecret) {
      txData.secondSecret = secondSecret;
    }
    return this.transactionService.putTransaction(txData);
  }

  /**销毁资产*/
  destoryAssets(
    assets: TYPE.AssetsBaseModel,
    fee = parseFloat(this.appSetting.settings.default_fee),
    secret: string,
    secondSecret?: string,
    publicKey = this.appSetting.user.publicKey,
    address = this.appSetting.user.address
  ) {
    // TODO:等春那边出来
    const txData: any = {
      type: this.transactionService.TransactionTypes.DESTORY_ASSET,
      secret,
      publicKey,
      fee,
      assetType: assets.abbreviation,
      asset: {
        destoryAsset: {
          abbreviation: assets.abbreviation,
        },
      },
    };
    if (secondSecret) {
      txData.secondSecret = secondSecret;
    }
    return this.transactionService.putTransaction(txData);
  }

  /**查询是否在销毁中*/
  async mixDestoryingAssets<T extends TYPE.AssetsBaseModel>(
    senderId: string,
    assets_list: T[]
  ) {
    // 先查询本地是否有相关的交易
    const localDestoryingAssetsTxList = await this.transactionService.unTxDb.find(
      {
        type: this.transactionService.TransactionTypes.DESTORY_ASSET,
        senderId,
      }
    );
    const destorying_map = new Map<string, TransactionModel>();
    localDestoryingAssetsTxList.forEach(trs => {
      destorying_map.set(trs["assetType"], trs);
    });
    assets_list.forEach(assets => {
      if (destorying_map.has(assets.abbreviation)) {
        assets["_destorying"] = true;
      }
    });
    return assets_list;
    // localDestoryingAssetsTxList
  }
}
