/// <reference path="../../../typings/globals.d.ts" />
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IonicStorageModule, Storage } from "@ionic/storage";
import { TransactionModel } from "../transaction-service/transaction.types";

import { Mdb } from "../mdb";

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
	mdb = new Mdb<VoucherModel>(this._dbname);
	constructor(public storage: Storage) {
		this.mdb.db.ensureIndex({ fieldName: "id", unique: true });
	}

	getVoucherListByPage(page: number, pageSize: number, desc?: boolean) {
		const from = (page - 1) * pageSize;
		return this.getVoucherListByOffset(from, pageSize, desc);
	}
	getVoucherListByOffset(offset: number, limit: number, desc?: boolean) {
		return this.mdb.find(
			{},
			{
				sort: { timestamp: desc ? -1 : 1 },
				skip: offset,
				limit,
			},
		);
	}
	async addVoucher(tran: VoucherModel) {
		if (await this.mdb.has(tran)) {
			return false;
		}
		await this.mdb.insert(tran);
		return true;
	}
	updateVoucher(tran: VoucherModel) {
		return this.mdb
			.update({ id: tran.id }, tran, { upsert: false })
			.then(n => n > 0);
	}
	removeVoucher(id: string) {
		return this.mdb.remove({ id }).then(n => n > 0);
	}
	// _total_amount?:number = 0;
	getTotalAmount() {
		return this.mdb.find({}).then(list => {
			return list.reduce((acc, item) => acc + parseFloat(item.amount), 0);
		});
	}
}
