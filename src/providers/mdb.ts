import * as _Nedb from "nedb/browser-version/out/nedb.min.js";
const Nedb: typeof __Nedb = _Nedb;

export class Mdb<T> {
	db: __Nedb;
	constructor(public name: string, inMemoryOnly?:boolean) {
		this.db = new Nedb({ filename: name, autoload: true, inMemoryOnly });
	}
	insert(item: T) {
		return this._insert<T>(item);
	}
	insertMany(list: T[]) {
		return this._insert<T[]>(list);
	}
	private _insert<M>(data) {
		return new Promise<M>((resolve, reject) => {
			this.db.insert(data, (err, res) => {
				if (err) {
					return reject(err);
				}
				resolve(res);
			});
		});
	}
	update(query: any, updateQuery: any, options?: Nedb.UpdateOptions) {
		return new Promise<boolean>((resolve, reject) => {
			this.db.update(query, updateQuery, options, (err, res) => {
				if (err) {
					return reject(err);
				}
				resolve(res > 0);
			});
		});
	}
	remove(query) {
		return new Promise((resolve, reject) => {
			this.db.remove(query, (err, res) => {
				if (err) {
					return reject(err);
				}
				resolve(res > 0);
			});
		});
	}
	findOne(query: any, projection?: T) {
		return new Promise<T | undefined>((resolve, reject) => {
			this.db.findOne<T>(query, projection as any, (err, res) => {
				if (err) {
					return reject(err);
				}
				resolve(res);
			});
		});
	}
	find(
		query,
		cursor_operators?: {
			sort?;
			skip?: number;
			limit?: number;
			projection?;
		},
	) {
		return new Promise<T[]>((resolve, reject) => {
			const cursor = this.db.find<T>(query);
			if (cursor_operators) {
				if (cursor_operators.sort) {
					cursor.sort(cursor_operators.sort);
				}
				if (typeof cursor_operators.skip === "number") {
					cursor.skip(cursor_operators.skip);
				}
				if (typeof cursor_operators.limit === "number") {
					cursor.limit(cursor_operators.limit);
				}
				if (cursor_operators.projection) {
					cursor.projection(cursor_operators.projection);
				}
			}
			cursor.exec((err, res) => {
				if (err) {
					return reject(err);
				}
				resolve(res);
			});
		});
	}
	has(query) {
		return this.find(query).then(res => res.length > 0);
	}
	clear() {
		return this.db.remove({});
	}
}
