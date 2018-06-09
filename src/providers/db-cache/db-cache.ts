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
export interface RequestOptionsWithResult<T = any> extends RequestOptions {
	result: T;
}

export interface installApiCache<T, R = any> {
	dbname: string;
	url: AppUrl;
	method: HTTP_Method;
	// 一个请求可以被拆分成多个请求，并返回数据库中查出来的数据
	beforeService: (
		db: Mdb<T>,
		request_opts: RequestOptions,
	) => Promise<{ reqs: RequestOptions[]; cache: R }>;
	// 多个请求返回后合并成一个请求
	afterService(
		req_res_list: RequestOptionsWithResult<R>[],
	): Promise<R | undefined | null> | R | undefined | null;
	// 将合并后的数据再放入数据库中，并返回最终结果
	dbHandle: (
		store: Mdb<T>,
		min_data: R | undefined | null,
		beforeService_cache: R,
	) => Promise<R>;
}
export interface installApiCacheOptions<T, R> {
	// 一个请求可以被拆分成多个请求
	// 多个请求返回后合并成一个请求
	// 将数据存储到数据库中
}

@Injectable()
export class DbCacheProvider {
	installDatabase<T>(
		dbname: string,
		indexs: any[],
		cb = (err, db: Mdb<T>) => {},
	) {
		var res = this.dbMap.get(dbname);
		if (!res) {
			const mdb = new Mdb<T>(dbname);
			this.dbMap.set(dbname, mdb);
			Promise.all(
				indexs.map(indexOpts => {
					return mdb.createIndex(indexOpts);
				}),
			).then(() => cb(null, mdb), err => cb(err, mdb));
			return mdb;
		} else {
			cb(null, res);
			return res;
		}
	}
	dbMap = new Map<string, Mdb<any>>();
	cache_api_map = new Map<string, installApiCache<any>>();
	installApiCache<T = any, R = any>(
		dbname: installApiCache<T, R>["dbname"],
		method: installApiCache<T, R>["method"],
		url: installApiCache<T, R>["url"],
		beforeService: installApiCache<T, R>["beforeService"],
		afterService: installApiCache<T, R>["afterService"],
		dbHandle: installApiCache<T, R>["dbHandle"],
	) {
		this.cache_api_map.set(`${method.toLowerCase()}:${url.path}`, {
			dbname,
			url,
			method,
			beforeService,
			afterService,
			dbHandle,
		});
	}
}
