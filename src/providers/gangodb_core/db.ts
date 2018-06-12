import * as EventEmitter from "eventemitter3";
import * as memoize from "memoizee";
import * as Q from "q";

import { getIDBError } from "./util";
import Collection from "./collection";

/**
 * Db blocked event.
 * @event Db#blocked
 *
 * @example
 * db.on('blocked', () => {
 *     console.log('database version cannot be upgraded');
 * });
 */

/**
 * Class representing a database.
 * @param {string} name The name of the database.
 * @param {number} [version] The version of the database.
 * @param {object|string[]} config The collections configuration.
 *
 * @example
 * let db = new zango.Db('mydb', {
 *     // Define collection.
 *     col1: {
 *         // Create index if it doesn't already exist.
 *         index1: true,
 *
 *         // Delete index from pre-existing database.
 *         index2: false
 *     },
 *
 *      // Define collection with indexes.
 *     col2: ['index1', 'index2'],
 *
 *     // Define collection without indexes.
 *     col3: true,
 *
 *     // Delete collection from pre-existing database.
 *     col4: false
 * });
 *
 * @example
 * // Define collections without indexes.
 * let db = new zango.Db('mydb', ['col1', 'col2']);
 */
export default class Db extends EventEmitter {
    _cols: { [key: string]: Collection } = {};
    _config = {};
    constructor(
        private _name: string,
        private _version?: number,
        config: any = {},
    ) {
        super();
        this._initGetConn();

        if (Array.isArray(config)) {
            config.forEach(name => (this._config[name] = true));
        }
        for (var name in config) {
            this._config[name] = config[name];
            this._addCollection(name);
            this._addIndex(this._config[name], name);
        }
    }

    /**
     * The name of the database.
     * @type {string}
     */
    get name() {
        return this._name;
    }

    /**
     * The version of the database.
     * @type {number}
     */
    get version() {
        return this._version;
    }

    private _addCollection(name) {
        return (this._cols[name] = new Collection(this, name));
    }
    collection(name: string) {
        // TODO: 支持动态升级
        if (!(name in this._cols)) {
            throw new Error(`collection ${name} no found.`);
            // this._addCollection(name);
        }
        return this._cols[name];
    }

    _addIndex(index_config, path) {
        const config = this._config;

        if (!index_config) {
            return (config[path] = false);
        }

        if (typeof index_config !== "object") {
            return (config[path] = {});
        }

        const col = this._cols[path];

        if (Array.isArray(index_config)) {
            const new_value = {};

            for (var index_path of index_config) {
                new_value[index_path] = true;

                col._indexes.add(index_path);
            }

            config[path] = new_value;
        } else {
            for (var index_keypath in index_config) {
                if (index_config[index_keypath]) {
                    col._indexes.add(index_keypath);
                }
            }

            config[path] = index_config;
        }
    }

    _addStore(idb: IDBDatabase, store_name: string) {
        const store = idb.createObjectStore(store_name, {
            keyPath: "_id",
            autoIncrement: true,
        });

        const index_config = this._config[store_name];

        for (var name in index_config) {
            if (index_config[name]) {
                const cur_index_config = name.split(":", 1);
                const default_config = { unique: false };
                const keyPath = cur_index_config[0];
                const optionParams = cur_index_config[1] || "";
                if (optionParams.startsWith("{")) {
                    try {
                        Object.assign(default_config, JSON.parse(optionParams));
                    } catch (err) {
                        console.warn(err);
                    }
                } else {
                    optionParams
                        .split(",")
                        .forEach(k => (default_config[k] = true));
                }
                store.createIndex(name, keyPath, default_config);
            } else {
                store.deleteIndex(name);
            }
        }
    }

    conn = (() => {
        return new Promise<IDBDatabase>((resolve, reject) => {
            this._getConn((err, conn) => {
                err ? reject(err) : resolve(conn);
            });
        });
    })();

    _idb?: IDBDatabase;
    _open = false;
    /*private */ _getConn(cb) {
        let req;

        if (this._version) {
            req = indexedDB.open(this._name, this._version);
        } else {
            req = indexedDB.open(this._name);
        }

        req.onsuccess = e => {
            const idb = e.target.result;

            this._idb = idb;
            this._version = idb.version;
            this._open = true;

            cb(null, idb);
        };

        req.onerror = e => cb(getIDBError(e));

        req.onupgradeneeded = e => {
            const idb = e.target.result;

            for (var name in this._config) {
                try {
                    if (!this._config[name]) {
                        idb.deleteObjectStore(name);
                    } else if (!idb.objectStoreNames.contains(name)) {
                        this._addStore(idb, name);
                    }
                } catch (error) {
                    return cb(error);
                }
            }
        };

        req.onblocked = () => this.emit("blocked");
    }
    private _db_conn?: Promise<IDBDatabase>;
    get dbConn() {
        if (!this._db_conn) {
            this._db_conn = new Promise((resolve, reject) => {
                this._getConn((err, idb) => (err ? reject(err) : resolve(idb)));
            });
        }
        return this._db_conn;
    }

    // getIDBTransaction(storeNames: string | string[]);

    _initGetConn() {
        this._getConn = memoize(this._getConn, { async: true });
    }

    /**
     * Open connection to the database.
     * @param {function} [cb] The result callback.
     * @return {Promise}
     */
    open(cb) {
        const deferred = Q.defer();

        this._getConn(error => {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(this);
            }
        });

        deferred.promise.nodeify(cb);

        return deferred.promise;
    }

    /**
     * Close the connection if it is open.
     */
    close() {
        if (this._open && this._idb) {
            this._idb.close();
            this._open = false;
            this._initGetConn();
        }
    }

    /**
     * Delete the database, closing the connection if it is open.
     * @param {function} [cb] The result callback.
     * @return {Promise}
     *
     * @example
     * db.drop((error) => {
     *     if (error) { throw error; }
     * });
     */
    drop(cb) {
        this.close();

        const deferred = Q.defer();
        const req = indexedDB.deleteDatabase(this._name);

        req.onsuccess = () => deferred.resolve();
        req.onerror = e => deferred.reject(getIDBError(e));

        deferred.promise.nodeify(cb);

        return deferred.promise;
    }
}
