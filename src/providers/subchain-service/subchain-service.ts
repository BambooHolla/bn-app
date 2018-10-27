import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppSettingProvider, ROUND_AB_Generator, HEIGHT_AB_Generator, AsyncBehaviorSubject } from "../app-setting/app-setting";
import { PromisePro } from "../../bnqkl-framework/PromiseExtends";
import { AppFetchProvider } from "../app-fetch/app-fetch";
import * as TYPE from "./subchain.types";
export * from "./subchain.types";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";

@Injectable()
export class SubchainServiceProvider {

  constructor(
    public appSetting: AppSettingProvider,
    public fetch: AppFetchProvider,
    public domSanitizer: DomSanitizer,
  ) {
  }

  readonly GET_SUBCHAIN = this.appSetting.APP_URL("/api/subchain/");
  readonly DOWNLOAD_SUBCHAIN_ASSETS = this.appSetting.APP_URL("/api/subchain/downloadSubchainPicture");

  private _subchainTop20Cache_length = 20
  private _subchainTop20Cache!: AsyncBehaviorSubject<TYPE.SubchainBaseModel[]>;
  @HEIGHT_AB_Generator("_subchainTop20Cache")
  private _subchainTop20Cache_Exector(promise_pro: PromisePro<TYPE.SubchainBaseModel[]>) {
    return promise_pro.follow(this._getSubchainList({}, 0, this._subchainTop20Cache_length));
  }
  /**
   * get subchain list
   */
  async getSubchainList(query: any, offset = 0, limit = 20) {
    const is_empty_query = Object.keys(query).length == 0;
    if (is_empty_query) {
      const res: TYPE.SubchainBaseModel[] = []
      const end = offset + limit;
      const { _subchainTop20Cache_length: cache_length } = this;
      if (offset < cache_length) {
        const cache = await this._subchainTop20Cache.getPromise()
        res.push(...cache.slice(offset, end));
      }
      if (end > cache_length) {
        const more = await this._getSubchainList(cache_length, end - cache_length);
        res.push(...more)
      }
      return res;
    }
    return this._getSubchainList(query, offset, limit);
  }
  /**
   * get subchain list
   */
  private _getSubchainList(query: any, offset?: number, limit?: number) {
    return this.fetch.get<{ subchains: TYPE.SubchainBaseModel[] }>(this.GET_SUBCHAIN, {
      search: Object.assign(query, {
        needLogo: 0,
        needBanner: 0,
        offset,
        limit
      })
    }).then(res => res.subchains);
  }

  getAssetsLogoHttpUrl(abbreviation: string, type: "logo" | "banner") {
    const query: any = { abbreviation };
    if (type === "logo") {
      query.downloadLogo = 1;
    } else if (type === "banner") {
      query.downloadBanner = 1;
    }
    return this.DOWNLOAD_SUBCHAIN_ASSETS.toString(query);
  }
  formatSubchainsToWithAssetsSafeUrl(subchain_list: TYPE.SubchainBaseModel[]) {
    return subchain_list.map(subchain => {
      return {
        ...subchain,
        logo_safe_url: this.domSanitizer.bypassSecurityTrustUrl(this.getAssetsLogoHttpUrl(subchain.abbreviation, "logo")),
        banner_safe_url: this.domSanitizer.bypassSecurityTrustUrl(this.getAssetsLogoHttpUrl(subchain.abbreviation, "banner")),
      }
    }) as TYPE.SubchainModelWithSafeUrl[]
  }
}
