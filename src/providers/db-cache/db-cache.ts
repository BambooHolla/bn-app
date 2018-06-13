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
		request_opts: RequestOptions,
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
	/*通用的将数据同步到数据库的操作*/
	async commonDbSync<T extends Object>(
		newest_list: T[],
		_old_list: T[] | undefined,
		db: Mdb<T>,
		db_query: any,
		unique_key: string,
	) {
		const old_list =
			_old_list instanceof Array ? _old_list : await db.find(db_query);
		const old_unique_map = new Map<string, T>(
			old_list.map(c => [c[unique_key], c] as [string, T]),
		);
		const res_unique_map = new Map<string, T>(
			newest_list.map(c => [c[unique_key], c] as [string, T]),
		);
		/// 需要更新的ITEM
		const update_following: T[] = [];
		// 将服务器的信息与本地信息进行混合
		const mixed_list = newest_list.map(c => {
			const old_item = old_unique_map.get(c[unique_key]);
			if (old_item) {
				let need_update = false;
				for (var k in c) {
					if (old_item[k] != c[k]) {
						old_item[k] = c[k];
						need_update = true;
					}
				}
				if (need_update) {
					update_following.push(old_item);
				}
				return old_item;
			}
			return c;
		});
		// 更新变动的ITEM
		if (update_following.length) {
			await Promise.all(
				update_following.map(c =>
					db.update({ ...db_query, [unique_key]: c[unique_key] }, c),
				),
			);
		}
		/// 插入新的ITEM
		const new_following = newest_list
			.filter(item => {
				return !old_unique_map.has(item[unique_key]);
			})
			.map(item => ({ ...(item as Object), ...db_query }));
		await db.insertMany(new_following);
		/// 删除不在列表中的ITEM
		const del_following = old_list.filter(
			c => !res_unique_map.has(c[unique_key]),
		);
		if (del_following.length) {
			await Promise.all(
				del_following.map(c =>
					db.remove({ ...db_query, [unique_key]: c[unique_key] }),
				),
			);
		}
		return {
			mixed_list,
			new_following,
			update_following,
			del_following,
		};
	}
}
