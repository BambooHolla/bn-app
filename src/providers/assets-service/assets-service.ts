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

	async getAssets(query) {
		const data = await this.fetch.get<{ assets: any[] }>(this.GET_ASSETS, {
			search: query,
		});
		return data.assets.map(assets => {
			return {
				...assets,
				logo: new Blob([Uint8Array.from(assets.logo.data).buffer]),
			} as TYPE.AssetsModel;
		});
	}
}
