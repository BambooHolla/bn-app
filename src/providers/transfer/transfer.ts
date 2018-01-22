import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
	AppSettingProvider,
	TB_AB_Generator,
} from "../app-setting/app-setting";
import { AppFetchProvider, CommonResponseData } from "../app-fetch/app-fetch";
export * from "./transfer.types";
import * as TYPE from "./transfer.types";

@Injectable()
export class TransferProvider {
	constructor(
		public appSetting: AppSettingProvider,
		public fetch: AppFetchProvider,
	) {}
	async getRollOutLogList(
		num = 20,
		from = new Date(),
	): Promise<TYPE.RollOutLogModel[]> {
		await new Promise(cb => setTimeout(cb, 300 * Math.random()));
		const from_val = from.valueOf();
		return Array.from(Array(num)).map((_, i) => {
			return {
				address: Array.from(Array(6))
					.map(_ =>
						Math.random()
							.toString(36)
							.substr(2),
					)
					.join("")
					.substr(0, 32),
				amount: Math.random() * 20,
				create_time: new Date(from_val - (i + 1) * 128e3),
			};
		});
	}
}
