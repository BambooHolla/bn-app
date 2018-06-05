import { Injectable } from "@angular/core";
import { AppUrl } from "../commonService";
import { RequestOptionsArgs } from "@angular/http";
interface RequestOptions {
	url: AppUrl;
	req: RequestOptionsArgs;
}
interface RequestOptionsWithResult<T = any> extends RequestOptions {
	result: T;
}

@Injectable()
export class DbCacheProvider {
	databaseName = "ifmchain";
	databaseVersion = 1;
	cacheDb = (() => {
		const openRequest = indexedDB.open(
			this.databaseName,
			this.databaseVersion,
		);
		return new Promise<IDBDatabase>((resolve, reject) => {
			openRequest.onupgradeneeded = event => {
				const db: IDBDatabase =
					(event.target && event.target["result"]) ||
					openRequest.result;
				db.onerror = function(err) {
					console.error("indexedDB error", err);
				};
				// Model 定义
				const store = db.createObjectStore("blocks", {
					keyPath: "height",
				});
				store.createIndex("block-id", "id", { unique: true });

				// resolve(db);
			};
			openRequest.onsuccess = event => {
				// Database is open and initialized - we're good to proceed.
				resolve(openRequest.result);
			};
			openRequest.onerror = reject;
		});
	})();
	cache_api_map = new Map<string, any>();
	installApiCache<T = any>(opts: {
		url: AppUrl;
		method: "get" | "post" | "put" | "delete";
		dataToArray: (data: any) => T[];
		dbHandle?: (store: IDBObjectStore, arr: T[]) => void;
		// 一个请求可以被拆分成多个请求
		beforeService?: (request_opts: RequestOptions) => RequestOptions[];
		// 多个请求返回后合并成一个请求
		afterService?: (req_res_list: RequestOptionsWithResult[]) => any;
	}) {
		if (!opts.dbHandle) {
			opts.dbHandle = (store: IDBObjectStore, arr: T[]) => {
				for (let item of arr) {
					store.add(item);
				}
			};
		}
		if (!opts.beforeService) {
			opts.beforeService = (request_opts: RequestOptions) => {
				return [request_opts];
			};
		}
		if (!opts.afterService) {
			opts.afterService = (req_res_list: RequestOptionsWithResult[]) => {
				const res: any = {};
				for (let req_res of req_res_list) {
					for (let k in req_res.result) {
						if (res[k] instanceof Array) {
							res[k].push(...req_res.result[k]);
						} else if (res[k] instanceof Object) {
							Object.assign(res[k], req_res.result[k]);
						} else {
							res[k] = req_res.result[k];
						}
					}
				}
				return res;
			};
		}
		this.cache_api_map.set(`${opts.method}:${opts.url.path}`, {
			save: data => {
				const arr = opts.dataToArray(data);
			},
			beforeService: opts.beforeService,
			afterService: opts.afterService,
		});
	}
}
