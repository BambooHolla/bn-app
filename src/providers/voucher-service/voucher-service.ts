import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IonicStorageModule, Storage } from "@ionic/storage";
import { TransactionModel } from "../transaction-service/transaction.types";

export type VocherModel = TransactionModel & {
	exchange_status: ExchangeStatus;
};
export enum ExchangeStatus {
	UNSUBMIT = "unsubmit",
	SUBMITED = "submited",
	CONFIRMED = "confirmed",
}

type DBConfig = {
	version: number;
	count: number;
	pageSize: number;
};

@Injectable()
export class VoucherServiceProvider {
	private _dbname = "voucher";
	constructor(public storage: Storage) {}
	default_config: DBConfig = {
		version: 1,
		count: 0, // 总数
		pageSize: 10, // 每页大小
	};
	private _config?: DBConfig;
	private _uniqueIdMap = new Map<string, number>();
	async getVoucherConfig() {
		if (!this._config) {
			const config_key = `${this._dbname}:config`;
			var config = await this.storage.get(config_key);
			if (!config || config.version !== this.default_config.version) {
				config = { ...this.default_config };
			}
			// 生成索引
			let cur_page = 0;
			let index = 0;
			do {
				const store_key = `${this._dbname}:page:${cur_page++}`;
				const cur_list: any[] = await this.storage.get(store_key);
				if (!cur_list) {
					break;
				}
				cur_list.forEach((item: VocherModel) => {
					this._uniqueIdMap.set(item.id, index++);
				});
			} while (true);
			config.count = this._uniqueIdMap.size;
			this._config = config;
			await this.storage.set(config_key, config);
		}
		return this._config as DBConfig;
	}
	getVoucherListByPage(page: number, pageSize: number, desc?: boolean) {
		const from = (page - 1) * pageSize;
		return this.getVoucherListByOffset(from, pageSize, desc);
	}
	async getVoucherListByOffset(
		offset: number,
		limit: number,
		desc?: boolean,
	) {
		const config = await this.getVoucherConfig();
		if (desc) {
			let from = config.count - offset - limit;
			if (from < 0) {
				limit += from;
				from = 0;
			}
			if (limit <= 0) {
				return [];
			}
			const list = await this._getVoucherListByOffset(from, limit);
			return list.reverse();
		}

		return this._getVoucherListByOffset(offset, limit);
	}
	async _getVoucherListByOffset(offset: number, limit: number) {
		const config = await this.getVoucherConfig();

		const res: VocherModel[] = [];
		const end_offset = Math.min(offset + limit, config.count);
		while (offset < end_offset) {
			const page = Math.floor(offset / config.pageSize);
			const cur_from = offset - page * config.pageSize;
			const store_key = `${this._dbname}:page:${page}`;
			const cur_list = await this.storage.get(store_key);
			if (!cur_list || cur_list.length === 0) {
				break;
			}
			const res_list = cur_list.slice(cur_from);
			res.push(...res_list);
			offset += res_list.length;
		}
		if (res.length > limit) {
			res.length = limit;
		}
		return res;
	}
	async addVoucher(tran: VocherModel) {
		const config = await this.getVoucherConfig();
		if (this._uniqueIdMap.has(tran.id)) {
			return false;
		}
		const page_num = Math.floor(config.count / config.pageSize);
		const stroge_key = `${this._dbname}:page:${page_num}`;
		const cur_list = (await this.storage.get(stroge_key)) || [];
		cur_list.push(tran);
		await this.storage.set(stroge_key, cur_list);
		this._uniqueIdMap.set(tran.id, config.count);
		config.count += 1;
		const config_key = `${this._dbname}:config`;
		await this.storage.set(config_key, config);
		return true;
	}
	async updateVoucher(tran: VocherModel) {
		const config = await this.getVoucherConfig();
		const up_index = this._uniqueIdMap.get(tran.id);
		if (typeof up_index !== "number") {
			return false;
		}
		const up_page = Math.floor(up_index / config.pageSize);
		const up_page_key = `${this._dbname}:page:${up_page}`;
		const up_list: VocherModel[] = await this.storage.get(up_page_key);
		up_list[up_index % config.pageSize] = tran;
		await this.storage.set(up_page_key, up_list);
		return true;
	}
	async removeVoucher(id: string) {
		const config = await this.getVoucherConfig();
		const remover_index = this._uniqueIdMap.get(id);
		if (typeof remover_index !== "number") {
			return false;
		}
		const in_page = Math.floor(remover_index / config.pageSize);
		const in_page_key = `${this._dbname}:page:${in_page}`;
		const in_list: VocherModel[] = await this.storage.get(in_page_key);
		if (!in_list || in_list.length === 0) {
			return false;
		}
		const in_index = remover_index % config.pageSize;

		// 更新列表
		in_list.splice(in_index, 1);
		// 取出后面的pages
		const max_page = Math.floor(config.count / config.pageSize);
		var full_list = in_list.slice();
		if (in_page < max_page) {
			const res_list = await Promise.all(
				Array.from({ length: max_page - in_page }, async (_, i) => {
					const cur_page = in_page + i + 1;
					const cur_page_key = `${this._dbname}:page:${cur_page}`;
					const cur_list: VocherModel[] = await this.storage.get(
						cur_page_key,
					);
					return cur_list;
				}),
			).then(list_list =>
				list_list.reduce((res, list) => res.concat(list), []),
			);
			full_list = in_list.concat(res_list);
		}
		// 批量更新
		await Promise.all(
			Array.from({ length: max_page - in_page + 1 }, async (_, i) => {
				const cur_page = in_page + i;
				const cur_page_key = `${this._dbname}:page:${cur_page}`;
				const cur_list = full_list.slice(
					i * config.pageSize,
					(i + 1) * config.pageSize,
				);
				const from_index = in_index + i * config.pageSize;
				cur_list.forEach((item, i) => {
					this._uniqueIdMap.set(item.id, from_index + i);
				});
				if (cur_list.length) {
					await this.storage.set(cur_page_key, cur_list);
				} else {
					await this.storage.remove(cur_page_key);
				}
			}),
		);

		return true;
	}
}
