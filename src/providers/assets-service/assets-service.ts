import { Injectable } from "@angular/core";
import { AppSettingProvider, AppUrl } from "../app-setting/app-setting";
import { TransactionServiceProvider } from "../transaction-service/transaction-service";
import { AppFetchProvider } from "../app-fetch/app-fetch";
import { formatImage } from "../../components/AniBase";
import * as TYPE from "./assets.types";
export * from "./assets.types";

@Injectable()
export class AssetsServiceProvider {
	constructor(
		public appSetting: AppSettingProvider,
		public fetch: AppFetchProvider,
		public transactionService: TransactionServiceProvider,
	) {}
	readonly GET_ASSETS_POSSESSOR = this.appSetting.APP_URL(
		"/api/assets/assetsPossessor",
	);
	readonly GET_RETURN_IBTDETAILS = this.appSetting.APP_URL(
		"/api/assets/returnIBTDetails",
	);
	readonly GET_ASSETS = this.appSetting.APP_URL("/api/assets/");
	readonly ADD_ASSETS = this.appSetting.APP_URL("/api/assets/tx/issuedAsset");
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
	/**数字资产的图片必须是jpg*/
	jpgBase64ToBlob(b64Data: string) {
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
	/**将图片转成统一的格式,512*512的jpeg*/
	imageUrlToJpegBase64(url: string, onlyBase64Content: boolean) {
		return formatImage(url, {
			format: "image/jpeg",
			max_width: 512,
			max_height: 512,
			target_encode: "base64",
			encoderOptions: 1,
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
		address = this.appSetting.user.address,
	) {
		const txData = {
			type: this.transactionService.TransactionTypes.ISSUE_ASSET,
			secret,
			secondSecret,
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
		return this.transactionService.putTransaction(txData);
	}
}
