import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IonicStorageModule, Storage } from "@ionic/storage";
import { TransactionModel } from "../transaction-service/transaction.types";
import * as Datastore from "nedb";
import * as __Nedb from "nedb/browser-version/out/nedb.min.js";
const Nedb: typeof Datastore = __Nedb;
window["__Nedb"] = __Nedb;

export type VoucherModel = TransactionModel & {
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
	// pageSize: number;
	totalAmount: number;
};

@Injectable()
export class VoucherServiceProvider {
	private _dbname = "voucher";
	db = new Nedb({ filename: this._dbname, autoload: true });
	constructor(public storage: Storage) {
		this.db.ensureIndex({ fieldName: "id", unique: true });
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
		return new Promise<VoucherModel[]>((resolve, reject) => {
			this.db
				.find<VoucherModel>({})
				.sort({ _id: desc ? -1 : 1 })
				.skip(offset)
				.limit(limit)
				.exec((err, res) => {
					if (err) {
						return reject(err);
					}
					resolve(res);
				});
		});
	}
	async addVoucher(tran: VoucherModel) {
		return new Promise((resolve, reject) => {
			this.db.insert(tran, (err, res) => {
				if (err) {
					return reject(err);
				}
				resolve(res);
			});
		});
	}
	async updateVoucher(tran: VoucherModel) {
		return new Promise<boolean>((resolve, reject) => {
			this.db.update(
				{ id: tran.id },
				tran,
				{ upsert: false },
				(err, res) => {
					if (err) {
						return reject(err);
					}
					resolve(res > 0);
				},
			);
		});
	}
	async removeVoucher(id: string) {
		return new Promise((resolve, reject) => {
			this.db.remove({ id }, (err, res) => {
				if (err) {
					return reject(err);
				}
				resolve(res > 0);
			});
		});
	}
	// _total_amount?:number = 0;
	async getTotalAmount() {
		// if(this._total_amount)
		// const config = await this.getVoucherConfig();
		// return config.totalAmount;
		return new Promise<number>((resolve, reject) => {
			this.db.find<VoucherModel>({}).exec((err, list) => {
				if (err) {
					return reject(err);
				}
				resolve(
					list.reduce(
						(acc, item) => acc + parseFloat(item.amount),
						0,
					),
				);
			});
		});
	}
}
