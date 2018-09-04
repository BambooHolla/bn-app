import { Injectable } from "@angular/core";
import { File } from "@ionic-native/file";
import { AOT } from "../../bnqkl-framework/helper";
import idb, { DB } from "idb";

const fileapi_shim = new AOT();
const initroot_shim = new AOT();

class BlockchainStoreIDB {
	private static _IDB_MAP = new Map<string, Promise<DB>>();
	private _getIdb(name: string) {
		let db = BlockchainStoreIDB._IDB_MAP.get(name);
		if (!db) {
			db = idb.open(name);
			BlockchainStoreIDB._IDB_MAP.set(name, db);
		}
		return db;
	}
	protected _db_prefix = "ibt_";
	protected _getDBName(chain_magic: string) {
		return this._db_prefix + chain_magic.toLowerCase();
	}
	async hasDB_idb(chain_magic: string) {
		const db_name = this._getDBName(chain_magic);
	}
	async createDB_idb(chain_magic: string) {
		const db_name = this._getDBName(chain_magic);
	}
	async deleteDB_idb(chain_magic: string) {
		const db_name = this._getDBName(chain_magic);
	}
}

@Injectable()
export class BlockchainStoreProvider extends BlockchainStoreIDB {
	constructor(public file: File) {
		super();
	}
	private async _initRoot() {
		try {
			const has_inited = await this.file.checkDir(
				this.file.dataDirectory,
				"blockchain"
			);

			if (!has_inited) {
				await this.file.createDir(
					this.file.dataDirectory,
					"blockchain",
					false
				);
			}
			fileapi_shim.compile(false);
		} catch (err) {
			console.log("没有cordova环境，使用IBD进行File API的模拟");
			fileapi_shim.compile(true);
		} finally {
			initroot_shim.compile(true);
		}
	}
	private _is_inited = this._initRoot();
	isInited() {
		return this._is_inited;
	}

	private _db_root = this.file.dataDirectory + "/blockchain";
	/**是否有指定标识的链*/
	@fileapi_shim.Then("hasDB_idb")
	@fileapi_shim.Wait("isInited")
	async hasDB(chain_magic: string) {
		const db_name = this._getDBName(chain_magic);
		return this.file.checkDir(this._db_root, db_name);
	}
	/**创建新链*/
	@fileapi_shim.Then("createDB_idb")
	@fileapi_shim.Wait("isInited")
	async createDB(chain_magic: string) {
		const db_name = this._getDBName(chain_magic);
		return this.file.createDir(this._db_root, db_name, false);
	}
	/**删除链*/
	@fileapi_shim.Then("deleteDB_idb")
	@fileapi_shim.Wait("isInited")
	async deleteDB(chain_magic: string) {
		const db_name = this._getDBName(chain_magic);
		return this.file.removeDir(this._db_root, db_name);
	}
}
