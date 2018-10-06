import { Injectable } from "@angular/core";
import { AppSettingProvider, AppUrl, HEIGHT_AB_Generator } from "../app-setting/app-setting";
import { TransactionServiceProvider, TransactionModel } from "../transaction-service/transaction-service";
import { AppFetchProvider } from "../app-fetch/app-fetch";
import { formatImage } from "../../components/AniBase";
import * as TYPE from "./assets.types";
export * from "./assets.types";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { AsyncBehaviorSubject } from "../../bnqkl-framework/RxExtends";
import { PromisePro } from "../../bnqkl-framework/PromiseExtends";
import { tryRegisterGlobal } from "../../bnqkl-framework/helper";
import { FLP_Tool } from "../../bnqkl-framework/FLP_Tool";
import { AccountServiceProvider } from "../account-service/account-service";

@Injectable()
export class AssetsServiceProvider extends FLP_Tool {
  constructor(
    public appSetting: AppSettingProvider,
    public fetch: AppFetchProvider,
    public transactionService: TransactionServiceProvider,
    public domSanitizer: DomSanitizer,
    public accountService: AccountServiceProvider
  ) {
    super();
    tryRegisterGlobal("assetsService", this);
  }
  readonly GET_ASSETS_POSSESSOR = this.appSetting.APP_URL("/api/assets/assetsPossessor");
  readonly GET_RETURN_IBTDETAILS = this.appSetting.APP_URL("/api/assets/returnIBTDetails");
  readonly GET_ASSETS = this.appSetting.APP_URL("/api/assets/");
  readonly GET_POSSESSOR_ASSETS = this.appSetting.APP_URL("/api/assets/possessorAssets");
  readonly ADD_ASSETS = this.appSetting.APP_URL("/api/assets/tx/issuedAsset");
  readonly DESTORY_ASSET = this.appSetting.APP_URL("/api/assets/tx/destoryAsset");
  readonly TRANSFER_ASSET = this.appSetting.APP_URL("/api/assets/tx");
  readonly DOWNLOAD_ASSETS_LOGO = this.appSetting.APP_URL("/api/assets/downloadAssetsLogo");

  readonly ibt_assets: TYPE.AssetsPersonalModelWithLogoSafeUrl = {
    transactionId: "",
    address: "",
    publicKey: "",
    /**英文缩写(unique)*/
    abbreviation: "IBT",
    genesisAddress: "",
    /**初始发行的资产数量*/
    expectedIssuedAssets: "0",
    expectedIssuedBlockHeight: 0,
    status: TYPE.ASSETS_STATUS.SUCCESS,
    dateCreated: AppSettingProvider.seedDateTimestamp,
    applyAssetBlockHeight: 0,
    hodingAssets: "",
    destoryAssets: "",
    logo_safe_url: this.domSanitizer.bypassSecurityTrustUrl("./assets/imgs/assets/IBT-assets-logo.jpg"),
  };

  formatAssetsToWithLogoSafeUrl<T extends TYPE.AssetsPersonalModel | TYPE.AssetsDetailModel>(assets: T[]) {
    return assets.map(assets => {
      const { logo, ...rest_assets } = assets as any;
      const res = {
        ...rest_assets,
      } as any;
      if ("expectedIssuedAssets" in res) {
        res.expectedIssuedAssets = parseFloat(res.expectedIssuedAssets);
      }
      if ("remainAssets" in res) {
        res.remainAssets = parseFloat(res.remainAssets);
      }
      if ("originalFrozenAssets" in res) {
        res.originalFrozenAssets = parseFloat(res.originalFrozenAssets);
      }
      if (logo) {
        const logo_blob = this.jpgBase64ToBlob(logo);
        res.logo_safe_url = this.domSanitizer.bypassSecurityTrustUrl(URL.createObjectURL(logo_blob));
      } else {
        res.logo_safe_url = this.domSanitizer.bypassSecurityTrustUrl(this.getAssetsLogoHttpUrl(assets.abbreviation));
      }
      return res as T extends TYPE.AssetsPersonalModel ? TYPE.AssetsPersonalModelWithLogoSafeUrl : TYPE.AssetsDetailModelWithLogoSafeUrl;
    });
  }

  /**获取资产*/
  async getAssets(query) {
    const data = await this.fetch.get<{ assets: TYPE.AssetsDetailModel[] }>(this.GET_ASSETS, {
      search: query,
    });
    return this.formatAssetsToWithLogoSafeUrl(data.assets) as TYPE.AssetsDetailModelWithLogoSafeUrl[];
  }
  getAssetsByAbbreviation(abbreviation: string) {
    return this.getAssets({ abbreviation }).then(list => list[0] as TYPE.AssetsDetailModelWithLogoSafeUrl | undefined);
  }
  /**获取数字资产的转化成IBT的比例*/
  async getAssetsToIBTRate(assets_info: TYPE.AssetsBaseModel) {
    const assets_query = {
      abbreviation: assets_info.abbreviation,
    };
    const [assets, issusingAccount] = await Promise.all([
      this.getAssets(assets_query).then(list => list[0]),
      await this.accountService.getAccountByAddress(assets_info.address),
    ]);
    if (!assets) {
      throw new Error(this.getTranslateSync("ASSETS_NOT_FOUND#ABBREVIATION#", assets_query));
    }
    return parseFloat(issusingAccount.balance) / parseFloat(assets["remainAssets"]);
  }
  async getAssetsToIBTRateByCache(assets_info: TYPE.AssetsBaseModel) {
    const my_assets_rate_map = await this.myAssetsRateMap.getPromise();
    if (!my_assets_rate_map.has(assets_info.abbreviation)) {
      const rate = await this.getAssetsToIBTRate(assets_info);
      my_assets_rate_map.set(assets_info.abbreviation, rate);
    }
    return my_assets_rate_map.get(assets_info.abbreviation) as number;
  }

  myAssetsRateMap!: AsyncBehaviorSubject<Map<string, number>>;
  @HEIGHT_AB_Generator("myAssetsRateMap")
  myAssetsRateMap_Executor(promise_pro: PromisePro<Map<string, number>>) {
    return promise_pro.follow(
      (async () => {
        const my_assets_list = await this.myAssetsList.getPromise();
        const res = new Map<string, number>();
        await Promise.all(my_assets_list.map(assets_info => this.getAssetsToIBTRate(assets_info).then(rate => res.set(assets_info.abbreviation, rate))));
        return res;
      })()
    );
  }

  /**我的账户的所有资产*/
  myAssetsList!: AsyncBehaviorSubject<TYPE.AssetsPersonalModelWithLogoSafeUrl[]>;
  @HEIGHT_AB_Generator("myAssetsList")
  myAssetsList_Executor(promise_pro) {
    // 初始化缓存100条，后面每个块更新增量缓存1条，最大缓存1000条数据
    return promise_pro.follow(this.getAllPossessorAssets(this.appSetting.user.address));
  }
  /**查询指定账户的所有可用资产*/
  async getAllPossessorAssets(address: string, extends_query?) {
    let page = 0;
    const pageSize = 40;
    const all_assets_list: TYPE.AssetsPersonalModelWithLogoSafeUrl[] = [];
    do {
      page += 1;
      const { assets_list, hasMore } = await this._getPossessorAssetsByPage(address, page, pageSize, extends_query);
      all_assets_list.push(...assets_list);
      if (!hasMore) {
        break;
      }
    } while (true);
    return all_assets_list;
  }
  /**查询指定页的资产列表*/
  private async _getPossessorAssetsByPage(address: string, page: number, pageSize: number, extends_query?) {
    let query_condition = {
      offset: (page - 1) * pageSize,
      limit: pageSize,
    };
    if (extends_query) {
      query_condition = Object.assign(extends_query, query_condition);
    }
    const assets_list = await this._getPossessorAssets(address, query_condition);

    return { assets_list, hasMore: assets_list.length >= pageSize };
  }
  async _getPossessorAssets(address: string, extends_query: object) {
    const data = await this.fetch.get<{ assets: TYPE.AssetsPersonalModel[] }>(this.GET_POSSESSOR_ASSETS, {
      search: {
        address,
        needLogo: 0,
        ...extends_query,
      },
    });
    return this.formatAssetsToWithLogoSafeUrl(data.assets);
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
      sourceMagic: string;
      logo: string;
      abbreviation: string;
      genesisAddress: string;
      expectedIssuedAssets: number;
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
    amount: number,
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
      amount,
      fee,
      assetType: assets.abbreviation,
    };
    if (secondSecret) {
      txData.secondSecret = secondSecret;
    }
    return this.transactionService.putTransaction(txData);
  }

  /**查询是否在销毁中*/
  async mixDestoryingAssets<T extends TYPE.AssetsBaseModel>(senderId: string, assets_list: T[]) {
    // 先查询本地是否有相关的交易
    const localDestoryingAssetsTxList = await this.transactionService.unTxDb.find({
      type: this.transactionService.TransactionTypes.DESTORY_ASSET,
      senderId,
    });
    const destorying_map = new Map<string, TransactionModel>();
    localDestoryingAssetsTxList.forEach(trs => {
      trs.assetType && destorying_map.set(trs.assetType, trs);
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
