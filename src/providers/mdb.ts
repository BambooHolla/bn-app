import Db from "./gangodb/src/db";
import Collection from "./gangodb/src/collection";
const mdb = new Db("ibt", 2, {
	blocks: ["height", "id"],
	account: ["address", "publicKey"],
	voted_delegate: true,
	voucher: true,
});

export class Mdb<T> {
	private db: Collection;
	constructor(public name: string, inMemoryOnly?: boolean) {
		this.db = mdb.collection(name);
	}
	createIndex(fieldOrSpec: string | Object, options?: Object) {
		// TODO
		return Promise.resolve(true);
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
	update(query: any, updateQuery: any) {
		return new Promise<number>((resolve, reject) => {
			this.db.update(query, updateQuery, (err, res) => {
				if (err) {
					return reject(err);
				}
				resolve(res);
			});
		});
	}
	remove(query) {
		return new Promise<number>((resolve, reject) => {
			this.db.remove(query, (err, res) => {
				if (err) {
					return reject(err);
				}
				resolve(res);
			});
		});
	}
	findOne(query: any, projection?: T) {
		return new Promise<T | undefined>((resolve, reject) => {
			this.db.findOne(query, projection as any, (err, res) => {
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
			const cursor = this.db.find(query);
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
					cursor.project(cursor_operators.projection);
				}
			}
			cursor.toArray((err, res) => {
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
		return new Promise<T[]>((resolve, reject) => {
			this.db.remove({}, (err, res) => {
				if (err) {
					return reject(err);
				}
				resolve(res);
			});
		});
	}
}
