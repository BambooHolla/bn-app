import { Injectable } from "@angular/core";
import { AppSettingProvider, AppUrl } from "../app-setting/app-setting";
import { AppFetchProvider } from "../app-fetch/app-fetch";
import * as TYPE from "./assets.types";
export * from "./assets.types";

@Injectable()
export class AssetsServiceProvider {
	constructor(
		public appSetting: AppSettingProvider,
		public fetch: AppFetchProvider,
	) {}
	readonly GET_ASSETS_POSSESSOR = this.appSetting.APP_URL(
		"/api/assets/assetsPossessor",
	);
	readonly GET_RETURN_IBTDETAILS = this.appSetting.APP_URL(
		"/api/assets/returnIBTDetails",
	);
	readonly GET_ASSETS = this.appSetting.APP_URL("/api/assets/");
	readonly ADD_ASSET = this.appSetting.APP_URL("/api/assets/tx/issuedAsset");
	readonly DESTORY_ASSET = this.appSetting.APP_URL(
		"/api/assets/tx/destoryAsset",
	);
	readonly TRANSFER_ASSET = this.appSetting.APP_URL("/api/assets/tx");

	/**获取资产*/
	async getAssets(query) {
		const data = await this.fetch.get<{ assets: any[] }>(this.GET_ASSETS, {
			search: query,
		});
		return data.assets.map(assets => {
			return {
				...assets,
				logo: this.jpgBase64ToBlob(assets.logo),
			} as TYPE.AssetsModel;
		});
	}
	/*数字资产的图片必须是jpg*/
	private jpgBase64ToBlob(b64Data: string) {
		const contentType = "image/jpg";
		var sliceSize = sliceSize || 512;

		const byteCharacters = atob(b64Data);
		const byteArrays: Uint8Array[] = [];

		for (
			var offset = 0;
			offset < byteCharacters.length;
			offset += sliceSize
		) {
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
	/**获取资产拥有者的列表*/
	async getAssetsOwnerList(query) {
		const data = await this.fetch.get<{
			possessors: TYPE.AssetsPossessorModel[];
		}>(this.GET_ASSETS_POSSESSOR, {
			search: query,
		});
		return data.possessors;
	}
}
