import { Injectable } from "@angular/core";
import { AppUrl } from "../commonService";
import { RequestOptionsArgs } from "@angular/http";
import { Mdb } from "../mdb";
export type HTTP_Method = "get" | "post" | "put" | "delete";
interface RequestOptions {
	method: HTTP_Method;
	url: AppUrl | string;
	reqOptions: RequestOptionsArgs;
	body?: any;
}
interface RequestOptionsWithResult<T = any> extends RequestOptions {
	result: T;
}

export interface installApiCache<T> {
	dbname: string;
	url: AppUrl;
	method: HTTP_Method;
	// 一个请求可以被拆分成多个请求，并返回数据库中查出来的数据
	beforeService: (
		db: Mdb<T>,
		request_opts: RequestOptions,
	) => Promise<{ reqs: RequestOptions[]; cache: any }>;
	// 多个请求返回后合并成一个请求
	afterService: (req_res_list: RequestOptionsWithResult[]) => any;
	// 将合并后的数据再放入数据库中，并返回最终结果
	dbHandle: (
		store: Mdb<T>,
		min_data: any,
		beforeService_cache: any,
	) => Promise<any>;
}
export interface installApiCacheOptions<T> {
	dbname: installApiCache<T>["dbname"];
	url: installApiCache<T>["url"];
	method: installApiCache<T>["method"];
	// 一个请求可以被拆分成多个请求
	beforeService: installApiCache<T>["beforeService"];
	// 多个请求返回后合并成一个请求
	afterService?: installApiCache<T>["afterService"];
	// 将数据存储到数据库中
	dbHandle: installApiCache<T>["dbHandle"];
}

@Injectable()
export class DbCacheProvider {
	async installDatabase(dbname: string, indexs: Nedb.EnsureIndexOptions[]) {
		if (this.dbMap.has(dbname)) {
			return this.dbMap.get(dbname);
		}
		const mdb = new Mdb(dbname);
		await Promise.all(
			indexs.map(indexOpts => {
				return new Promise((resolve, reject) => {
					mdb.db.ensureIndex(
						indexOpts,
						err => (err ? reject(err) : resolve),
					);
				});
			}),
		);
		this.dbMap.set(dbname, mdb);
		return mdb;
	}
	dbMap = new Map<string, Mdb<any>>();
	cache_api_map = new Map<string, installApiCache<any>>();
	installApiCache<T = any>(opts: installApiCacheOptions<T>) {
		// if (!opts.dbHandle) {
		// 	opts.dbHandle = (db: Mdb<T>, arr: T[]) => {
		// 		return db.insertMany(arr);
		// 	};
		// }
		// if (!opts.beforeService) {
		// 	opts.beforeService = async (db: Mdb<T>, request_opts: RequestOptions) => {
		// 		const  cache = db.;
		// 		return { reqs: [request_opts], cache };
		// 	};
		// }
		if (!opts.afterService) {
			opts.afterService = (req_res_list: RequestOptionsWithResult[]) => {
				const res: any = {};
				for (var req_res of req_res_list) {
					for (var k in req_res.result) {
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
		this.cache_api_map.set(
			`${opts.method.toLowerCase()}:${opts.url.path}`,
			{
				...opts,
			} as any,
		);
	}
}
