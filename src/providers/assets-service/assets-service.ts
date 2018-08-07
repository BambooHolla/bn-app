import { Injectable } from "@angular/core";
import { AppSettingProvider, AppUrl } from "../app-setting/app-setting";
import {
	TransactionServiceProvider,
	TransactionModel,
} from "../transaction-service/transaction-service";
import { AppFetchProvider } from "../app-fetch/app-fetch";
import { formatImage } from "../../components/AniBase";
import * as TYPE from "./assets.types";
export * from "./assets.types";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";

@Injectable()
export class AssetsServiceProvider {
	constructor(
		public appSetting: AppSettingProvider,
		public fetch: AppFetchProvider,
		public transactionService: TransactionServiceProvider,
		public domSanitizer: DomSanitizer,
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
			const logo = this.jpgBase64ToBlob(assets.logo);
			return {
				...assets,
				logo,
				logo_safe_url: this.domSanitizer.bypassSecurityTrustUrl(
					URL.createObjectURL(logo),
				),
			} as TYPE.AssetsModelWithLogoSafeUrl;
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
		address = this.appSetting.user.address,
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
		assets: TYPE.AssetsModel,
		fee = parseFloat(this.appSetting.settings.default_fee),
		secret: string,
		secondSecret?: string,
		publicKey = this.appSetting.user.publicKey,
		address = this.appSetting.user.address,
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
	async mixDestoryingAssets<T extends TYPE.AssetsModel>(
		senderId: string,
		assets_list: T[],
	) {
		// 先查询本地是否有相关的交易
		const localDestoryingAssetsTxList = await this.transactionService.unTxDb.find(
			{
				type: this.transactionService.TransactionTypes.DESTORY_ASSET,
				senderId,
			},
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
