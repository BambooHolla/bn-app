var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
System.register("bnqkl-framework/PromiseExtends", ["eventemitter3"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    function autoAbort(target, name, descriptor) {
        const fun = descriptor.value;
        let _lock;
        descriptor.value = function (...args) {
            if (_lock) {
                _lock.abort();
                _lock = undefined;
            }
            const res = (_lock = fun.apply(this, args));
            res.promise.then(() => {
                _lock = undefined;
            });
            return res;
        };
    }
    exports_1("autoAbort", autoAbort);
    var EventEmitter, PromiseOut, AbortError, PromisePro, DelayPromise, sleep;
    return {
        setters: [
            function (EventEmitter_1) {
                EventEmitter = EventEmitter_1;
            }
        ],
        execute: function () {
            /**
             * 将resolve和reject暴露出来
             *
             * @export
             * @class PromiseOut
             * @template T
             */
            PromiseOut = class PromiseOut {
                constructor(promiseCon = Promise) {
                    this.promise = new promiseCon((_resolve, _reject) => {
                        this.resolve = _resolve;
                        this.reject = _reject;
                    });
                }
            };
            exports_1("PromiseOut", PromiseOut);
            /**
             * Why AbortError
             * 为了和其它的Error进行区分
             * 一般的Error是来自代码的异常、数据服务的异常
             * 但是AbortError是来自用户的操作，主动取消某个执行中的动作
             * 一般来说如果是AbortError，我们可以跳过不处理，至少不需要将这种异常展示给用户
             *
             * @export
             * @class AbortError
             * @extends {Error}
             */
            AbortError = class AbortError extends Error {
                constructor() {
                    super(...arguments);
                    this.ABORT_ERROR_FLAG = true;
                }
            };
            exports_1("AbortError", AbortError);
            PromisePro = class PromisePro extends PromiseOut {
                constructor(promiseCon) {
                    super(promiseCon);
                    this.is_done = false;
                }
                abort(abort_message = "Abort") {
                    if (this.is_done) {
                        return;
                    }
                    this.reject((this.abort_error = new AbortError(abort_message)));
                    this._tryEmit("abort", this.abort_error, this);
                }
                get event() {
                    if (!this._event) {
                        this._event = new EventEmitter();
                    }
                    return this._event;
                }
                _tryEmit(eventname, ...args) {
                    if (this._event) {
                        this._event.emit(eventname, ...args);
                    }
                }
                onAbort(cb) {
                    this.event.on("abort", cb);
                }
                follow(from_promise) {
                    from_promise.then(this.resolve).catch(this.reject);
                    return this.promise;
                }
                static fromPromise(promise) {
                    const res = new PromisePro();
                    if (promise instanceof DelayPromise) {
                        promise.delayThen(res.resolve);
                        promise.delayCatch(res.reject);
                    }
                    else {
                        promise.then(res.resolve);
                        promise.catch(res.reject);
                    }
                    return res;
                }
            };
            exports_1("PromisePro", PromisePro);
            /**
             * 在调用.then或者.catch的时候才会执行启动函数
             */
            DelayPromise = class DelayPromise extends Promise {
                constructor(executor) {
                    var _resolve;
                    var _reject;
                    super((resolve, reject) => {
                        _resolve = resolve;
                        _reject = reject;
                    });
                    var is_runed = false;
                    const run_executor = () => {
                        if (!is_runed) {
                            executor(_resolve, _reject);
                            is_runed = true;
                        }
                    };
                    this.then = (onfulfilled, onrejected) => {
                        run_executor();
                        return this.delayThen(onfulfilled, onrejected);
                    };
                    this.catch = (onrejected) => {
                        run_executor();
                        return this.delayCatch(onrejected);
                    };
                }
                delayThen(onfulfilled, onrejected) {
                    return super.then(onfulfilled, onrejected);
                }
                delayCatch(onrejected) {
                    return super.catch(onrejected);
                }
            };
            exports_1("DelayPromise", DelayPromise);
            exports_1("sleep", sleep = (ms) => {
                return new Promise(cb => setTimeout(cb, ms));
            });
        }
    };
});
System.register("bnqkl-framework/helper", [], function (exports_2, context_2) {
    "use strict";
    var __moduleName = context_2 && context_2.id;
    function tryRegisterGlobal(name, obj) {
        if (is_dev) {
            return (window[name] = obj);
        }
    }
    exports_2("tryRegisterGlobal", tryRegisterGlobal);
    var is_dev;
    return {
        setters: [],
        execute: function () {
            exports_2("is_dev", is_dev = (() => {
                const test_fun = function DEV_WITH_FULL_NAME() { };
                return test_fun.name === "DEV_WITH_FULL_NAME";
                // return isDevMode();
            })());
        }
    };
});
System.register("providers/gangodb_core/util", ["deepmerge", "clone", "object-hash"], function (exports_3, context_3) {
    "use strict";
    var __moduleName = context_3 && context_3.id;
    var deepmerge_1, clone, objectHash, toPathPieces, _exists, exists, create, get, set, isObject, modify, remove1, _remove2, remove2, rename, _copy, copy, equal, unknownOp, hashify, getIDBError;
    return {
        setters: [
            function (deepmerge_1_1) {
                deepmerge_1 = deepmerge_1_1;
            },
            function (clone_1) {
                clone = clone_1;
            },
            function (objectHash_1) {
                objectHash = objectHash_1;
            }
        ],
        execute: function () {
            exports_3("toPathPieces", toPathPieces = (path) => path.split("."));
            _exists = (obj, path_pieces) => {
                for (var i = 0; i < path_pieces.length - 1; i++) {
                    const piece = path_pieces[i];
                    if (!obj.hasOwnProperty(piece)) {
                        return;
                    }
                    obj = obj[piece];
                    if (!isObject(obj)) {
                        return;
                    }
                }
                if (obj.hasOwnProperty(path_pieces[i])) {
                    return obj;
                }
            };
            exports_3("exists", exists = (obj, path_pieces) => {
                return !!_exists(obj, path_pieces);
            });
            exports_3("create", create = (obj, path_pieces, i) => {
                for (var j = i; j < path_pieces.length - 1; j++) {
                    obj[path_pieces[j]] = {};
                    obj = obj[path_pieces[j]];
                }
                return obj;
            });
            exports_3("get", get = (obj, path_pieces, fn) => {
                if ((obj = _exists(obj, path_pieces))) {
                    fn(obj, path_pieces[path_pieces.length - 1]);
                }
            });
            // Set a value, creating the path if it doesn't exist.
            exports_3("set", set = (obj, path_pieces, value) => {
                const fn = (obj, field) => (obj[field] = value);
                modify(obj, path_pieces, fn, fn);
            });
            exports_3("isObject", isObject = obj => {
                return typeof obj === "object" && obj !== null;
            });
            // Update a value or create it and its path if it doesn't exist.
            exports_3("modify", modify = (obj, path_pieces, update, init) => {
                const last = path_pieces[path_pieces.length - 1];
                const _create = i => {
                    obj = create(obj, path_pieces, i);
                    init(obj, last);
                };
                if (!obj.hasOwnProperty(path_pieces[0])) {
                    return _create(0);
                }
                if (path_pieces.length > 1) {
                    obj = obj[path_pieces[0]];
                    for (var i = 1; i < path_pieces.length - 1; i++) {
                        const piece = path_pieces[i];
                        if (!isObject(obj[piece])) {
                            return;
                        }
                        if (Array.isArray(obj) && piece < 0) {
                            return;
                        }
                        if (!obj.hasOwnProperty(piece)) {
                            return _create(i);
                        }
                        obj = obj[piece];
                    }
                }
                update(obj, last);
            });
            // Delete specified paths from object.
            exports_3("remove1", remove1 = (obj, path_pieces) => {
                for (var i = 0; i < path_pieces.length - 1; i++) {
                    obj = obj[path_pieces[i]];
                    if (!isObject(obj)) {
                        return;
                    }
                }
                if (Array.isArray(obj)) {
                    const index = Number.parseFloat(path_pieces[i]);
                    if (Number.isInteger(index)) {
                        obj.splice(index, 1);
                    }
                }
                else {
                    delete obj[path_pieces[i]];
                }
            });
            _remove2 = (obj, new_obj, paths) => {
                const fn = field => {
                    const new_paths = [];
                    for (var path_pieces of paths) {
                        if (path_pieces[0] !== field) {
                            continue;
                        }
                        if (path_pieces.length === 1) {
                            return;
                        }
                        new_paths.push(path_pieces.slice(1));
                    }
                    if (!new_paths.length) {
                        new_obj[field] = clone(obj[field]);
                    }
                    else {
                        const value = obj[field];
                        new_obj[field] = new value.constructor();
                        _remove2(value, new_obj[field], new_paths);
                    }
                };
                for (var field in obj) {
                    fn(field);
                }
            };
            // Copy an object ignoring specified paths.
            exports_3("remove2", remove2 = (obj, paths) => {
                const new_obj = new obj.constructor();
                _remove2(obj, new_obj, paths);
                return new_obj;
            });
            exports_3("rename", rename = (obj1, path_pieces, new_name) => {
                get(obj1, path_pieces, (obj2, field) => {
                    obj2[new_name] = obj2[field];
                    delete obj2[field];
                });
            });
            // Copy an object by a path ignoring other fields.
            _copy = (obj, new_obj, path_pieces) => {
                for (var i = 0; i < path_pieces.length - 1; i++) {
                    const piece = path_pieces[i];
                    obj = obj[piece];
                    if (!isObject(obj)) {
                        return;
                    }
                    new_obj[piece] = new obj.constructor();
                    new_obj = new_obj[piece];
                }
                if (obj.hasOwnProperty(path_pieces[i])) {
                    new_obj[path_pieces[i]] = obj[path_pieces[i]];
                    return obj;
                }
            };
            // Copy an object by specified paths ignoring other paths.
            exports_3("copy", copy = (obj, paths) => {
                let new_objs = [];
                for (var path_pieces of paths) {
                    const new_obj = new obj.constructor();
                    if (_copy(obj, new_obj, path_pieces)) {
                        new_objs.push(new_obj);
                    }
                }
                return new_objs.reduce(deepmerge_1.default, {});
            });
            exports_3("equal", equal = (value1, value2) => {
                return hashify(value1) === hashify(value2);
            });
            exports_3("unknownOp", unknownOp = name => {
                throw Error(`unknown operator '${name}'`);
            });
            exports_3("hashify", hashify = value => {
                if (value === undefined) {
                    return;
                }
                return objectHash(value);
            });
            exports_3("getIDBError", getIDBError = e => Error(e.target.error.message));
        }
    };
});
System.register("providers/gangodb_core/lang/missing_symbol", [], function (exports_4, context_4) {
    "use strict";
    var __moduleName = context_4 && context_4.id;
    return {
        setters: [],
        execute: function () {
            exports_4("default", Symbol('missing'));
        }
    };
});
System.register("providers/gangodb_core/lang/fields", ["memoizee", "providers/gangodb_core/util", "providers/gangodb_core/lang/missing_symbol"], function (exports_5, context_5) {
    "use strict";
    var __moduleName = context_5 && context_5.id;
    var memoizee_1, util_1, missing_symbol_1, Fields;
    return {
        setters: [
            function (memoizee_1_1) {
                memoizee_1 = memoizee_1_1;
            },
            function (util_1_1) {
                util_1 = util_1_1;
            },
            function (missing_symbol_1_1) {
                missing_symbol_1 = missing_symbol_1_1;
            }
        ],
        execute: function () {
            Fields = class Fields {
                constructor(_doc) {
                    this._doc = _doc;
                    this.get = memoizee_1.default(this.get);
                }
                get(path) {
                    let value = missing_symbol_1.default;
                    util_1.get(this._doc, path.pieces, (obj, field) => {
                        value = obj[field];
                    });
                    return value;
                }
                ensure(paths) {
                    for (var path of paths) {
                        if (this.get(path) === missing_symbol_1.default) {
                            return false;
                        }
                    }
                    return true;
                }
            };
            exports_5("default", Fields);
        }
    };
});
System.register("providers/gangodb_core/filter", ["providers/gangodb_core/lang/fields"], function (exports_6, context_6) {
    "use strict";
    var __moduleName = context_6 && context_6.id;
    function filter(next, pred) {
        return cb => {
            (function iterate() {
                next((error, doc, idb_cur) => {
                    if (!doc) {
                        cb(error);
                    }
                    else if (pred.run(new fields_1.default(doc))) {
                        cb(null, doc, idb_cur);
                    }
                    else {
                        iterate();
                    }
                });
            })();
        };
    }
    exports_6("default", filter);
    var fields_1;
    return {
        setters: [
            function (fields_1_1) {
                fields_1 = fields_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("providers/gangodb_core/sort", ["providers/gangodb_core/util"], function (exports_7, context_7) {
    "use strict";
    var __moduleName = context_7 && context_7.id;
    function sort(_next, spec) {
        const sorts = [];
        for (var path in spec) {
            sorts.push([util_2.toPathPieces(path), spec[path]]);
        }
        const sortFn = (a, b) => {
            for (var [path_pieces, order] of sorts) {
                const result = compare(a, b, path_pieces, order);
                if (result > 0 || result < 0) {
                    return result;
                }
            }
            return -order;
        };
        let docs = [];
        const fn = cb => cb(null, docs.pop());
        let next = cb => {
            const done = error => {
                if (error) {
                    return cb(error);
                }
                docs = docs.sort(sortFn);
                (next = fn)(cb);
            };
            (function iterate() {
                _next((error, doc) => {
                    if (!doc) {
                        return done(error);
                    }
                    docs.push(doc);
                    iterate();
                });
            })();
        };
        return cb => next(cb);
    }
    exports_7("default", sort);
    var util_2, compare;
    return {
        setters: [
            function (util_2_1) {
                util_2 = util_2_1;
            }
        ],
        execute: function () {
            compare = (a, b, path_pieces, order) => {
                for (var i = 0; i < path_pieces.length - 1; i++) {
                    const piece = path_pieces[i];
                    a = a[piece];
                    b = b[piece];
                    if (!util_2.isObject(a)) {
                        if (!util_2.isObject(b)) {
                            return null;
                        }
                    }
                    else if (util_2.isObject(b)) {
                        continue;
                    }
                    return order;
                }
                const piece = path_pieces[i];
                if (!a.hasOwnProperty(piece)) {
                    if (!b.hasOwnProperty(piece)) {
                        return null;
                    }
                }
                else if (b.hasOwnProperty(piece)) {
                    a = a[piece];
                    b = b[piece];
                    if (util_2.equal(a, b)) {
                        return 0;
                    }
                    return (a < b ? 1 : -1) * order;
                }
                return order;
            };
        }
    };
});
System.register("providers/gangodb_core/lang/path", ["providers/gangodb_core/util"], function (exports_8, context_8) {
    "use strict";
    var __moduleName = context_8 && context_8.id;
    var util_3, Path;
    return {
        setters: [
            function (util_3_1) {
                util_3 = util_3_1;
            }
        ],
        execute: function () {
            Path = class Path {
                constructor(path) {
                    this.pieces = util_3.toPathPieces(path);
                    this.literal = path;
                }
            };
            exports_8("default", Path);
        }
    };
});
System.register("providers/gangodb_core/lang/filter", ["providers/gangodb_core/util", "providers/gangodb_core/lang/missing_symbol", "providers/gangodb_core/lang/path", "providers/gangodb_core/lang/fields"], function (exports_9, context_9) {
    "use strict";
    var __moduleName = context_9 && context_9.id;
    var util_4, missing_symbol_2, path_1, fields_2, isIndexMatchable, Operator, Connective, Conjunction, Disjunction, Negation, Exists, Equal, NotEqual, Range, rangeMixin, gt, gte, lt, lte, Gt, Gte, Lt, Lte, GtLt, GteLt, GtLte, GteLte, ElemMatch, RegEx, $and, $or, $not, connectives, ranges, buildRange, buildClause, build;
    return {
        setters: [
            function (util_4_1) {
                util_4 = util_4_1;
            },
            function (missing_symbol_2_1) {
                missing_symbol_2 = missing_symbol_2_1;
            },
            function (path_1_1) {
                path_1 = path_1_1;
            },
            function (fields_2_1) {
                fields_2 = fields_2_1;
            }
        ],
        execute: function () {
            isIndexMatchable = (value) => {
                if (typeof value === 'number') {
                    return !isNaN(value);
                }
                if (typeof value === 'string') {
                    return true;
                }
                if (typeof value === 'boolean') {
                    return true;
                }
                if (!value) {
                    return false;
                }
                if (value.constructor === Object) {
                    return false;
                }
                if (Array.isArray(value)) {
                    for (var element of value) {
                        if (!isIndexMatchable(element)) {
                            return false;
                        }
                    }
                    return true;
                }
                if (value instanceof Date) {
                    return !isNaN(value.valueOf());
                }
                return false;
            };
            Operator = class Operator {
                getClauses() {
                    return this.is_index_matchable ? [this] : [];
                }
            };
            exports_9("Operator", Operator);
            Connective = class Connective extends Operator {
                constructor(args) {
                    super();
                    this.args = args;
                }
            };
            exports_9("Connective", Connective);
            Conjunction = class Conjunction extends Connective {
                getClauses() {
                    const clauses = [];
                    for (var i = 0; i < this.args.length; i++) {
                        const op = this.args[i];
                        if (op instanceof Connective) {
                            clauses.push(...op.getClauses());
                        }
                        else if (op.is_index_matchable) {
                            op.parent = this;
                            op.index = i;
                            clauses.push(op);
                        }
                    }
                    return clauses;
                }
                run(fields) {
                    for (var arg of this.args) {
                        if (!arg.run(fields)) {
                            return false;
                        }
                    }
                    return true;
                }
            };
            exports_9("Conjunction", Conjunction);
            Disjunction = class Disjunction extends Connective {
                getClauses() { return []; }
                run(fields) {
                    for (var arg of this.args) {
                        if (arg.run(fields)) {
                            return true;
                        }
                    }
                    return false;
                }
            };
            exports_9("Disjunction", Disjunction);
            Negation = class Negation extends Conjunction {
                getClauses() { return []; }
                run(fields) { return !super.run(fields); }
            };
            Exists = class Exists extends Operator {
                constructor(path, bool) {
                    super();
                    this.path = path;
                    this.bool = bool;
                }
                get is_index_matchable() { return !!this.bool; }
                run(fields) {
                    return fields.get(this.path) !== missing_symbol_2.default === this.bool;
                }
            };
            exports_9("Exists", Exists);
            Equal = class Equal extends Operator {
                constructor(path, value) {
                    super();
                    this.path = path;
                    this.value = value;
                }
                get is_index_matchable() {
                    return isIndexMatchable(this.value);
                }
                get idb_key_range() {
                    return IDBKeyRange.only(this.value);
                }
                run(fields) {
                    const value = fields.get(this.path);
                    if (value === missing_symbol_2.default) {
                        return false;
                    }
                    return util_4.equal(value, this.value);
                }
            };
            NotEqual = class NotEqual extends Equal {
                get is_index_matchable() { return false; }
                run(fields) { return !super.run(fields); }
            };
            Range = class Range extends Operator {
                constructor(path, fns, values) {
                    super();
                    this.path = path;
                    this.fns = fns;
                    this.values = values;
                }
                get is_index_matchable() { return true; }
                run(fields) {
                    const value = fields.get(this.path);
                    if (value === missing_symbol_2.default || value == null) {
                        return false;
                    }
                    const { fns, values } = this;
                    for (var i = 0; i < fns.length; i++) {
                        if (!fns[i](value, values[i])) {
                            return false;
                        }
                    }
                    return true;
                }
            };
            rangeMixin = (...fns) => {
                return class extends Range {
                    constructor(path, values) { super(path, fns, values); }
                };
            };
            gt = (a, b) => a > b, gte = (a, b) => a >= b, lt = (a, b) => a < b, lte = (a, b) => a <= b;
            Gt = class Gt extends rangeMixin(gt) {
                get idb_key_range() {
                    return IDBKeyRange.lowerBound(this.values[0], this.values[1] || true);
                }
            };
            Gte = class Gte extends rangeMixin(gte) {
                get idb_key_range() {
                    return IDBKeyRange.lowerBound(this.values[0], this.values[1]);
                }
            };
            Lt = class Lt extends rangeMixin(lt) {
                get idb_key_range() {
                    return IDBKeyRange.upperBound(this.values[0], this.values[1]
                        || true);
                }
            };
            Lte = class Lte extends rangeMixin(lte) {
                get idb_key_range() {
                    return IDBKeyRange.upperBound(this.values[0], this.values[1]);
                }
            };
            GtLt = class GtLt extends rangeMixin(gt, lt) {
                get idb_key_range() {
                    return IDBKeyRange.bound(this.values[0], this.values[1]
                        || true, true);
                }
            };
            GteLt = class GteLt extends rangeMixin(gte, lt) {
                get idb_key_range() {
                    return IDBKeyRange.bound(this.values[0], this.values[1]
                        || false, true);
                }
            };
            GtLte = class GtLte extends rangeMixin(gt, lte) {
                get idb_key_range() {
                    return IDBKeyRange.bound(this.values[0], this.values[1]
                        || true, false);
                }
            };
            GteLte = class GteLte extends rangeMixin(gte, lte) {
                get idb_key_range() {
                    return IDBKeyRange.bound(this.values[0], this.values[1]);
                }
            };
            ElemMatch = class ElemMatch extends Operator {
                constructor(path, op) {
                    super();
                    this.path = path;
                    this.op = op;
                }
                get is_index_matchable() { return false; }
                run(fields) {
                    const elements = fields.get(this.path);
                    if (!elements || !elements[Symbol.iterator]) {
                        return false;
                    }
                    const { op } = this;
                    for (var obj of elements) {
                        if (util_4.isObject(obj) && op.run(new fields_2.default(obj))) {
                            return true;
                        }
                    }
                    return false;
                }
            };
            RegEx = class RegEx extends Operator {
                constructor(path, expr) {
                    super();
                    this.path = path;
                    this.expr = expr;
                }
                get is_index_matchable() { return false; }
                run(fields) {
                    const value = fields.get(this.path);
                    if (value === missing_symbol_2.default) {
                        return false;
                    }
                    return this.expr.test(value);
                }
            };
            $and = (parent_args, args) => {
                for (var expr of args) {
                    const arg = build(expr);
                    if (arg === false) {
                        return false;
                    }
                    if (!arg) {
                        continue;
                    }
                    if (arg.constructor === Conjunction) {
                        parent_args.push(...arg.args);
                    }
                    else {
                        parent_args.push(arg);
                    }
                }
                return true;
            };
            $or = (parent_args, args) => {
                const new_args = [];
                let has_false;
                for (var expr of args) {
                    const arg = build(expr);
                    if (!arg) {
                        if (arg === false) {
                            has_false = true;
                        }
                        continue;
                    }
                    if (arg.constructor === Disjunction) {
                        new_args.push(...arg.args);
                    }
                    else {
                        new_args.push(arg);
                    }
                }
                if (new_args.length > 1) {
                    parent_args.push(new Disjunction(new_args));
                }
                else if (new_args.length) {
                    parent_args.push(new_args[0]);
                }
                else if (has_false) {
                    return false;
                }
                return true;
            };
            $not = (parent_args, args) => {
                const new_args = [];
                for (var expr of args) {
                    const arg = build(expr);
                    if (arg) {
                        new_args.push(arg);
                    }
                }
                if (new_args.length) {
                    parent_args.push(new Negation(new_args));
                }
                return true;
            };
            connectives = {
                $and,
                $or,
                $not,
                $nor: $not
            };
            ranges = [
                [GtLt, '$gt', '$lt'],
                [GteLt, '$gte', '$lt'],
                [GtLte, '$gt', '$lte'],
                [GteLte, '$gte', '$lte'],
                [Gt, '$gt'],
                [Gte, '$gte'],
                [Lt, '$lt'],
                [Lte, '$lte']
            ];
            buildRange = (new_args, path, params, op_keys) => {
                const build = (RangeOp, range_keys) => {
                    const values = [];
                    for (var name of range_keys) {
                        if (!op_keys.has(name)) {
                            return;
                        }
                        const value = params[name];
                        if (!isIndexMatchable(value)) {
                            return false;
                        }
                        values.push(value);
                    }
                    new_args.push(new RangeOp(path, values));
                    return true;
                };
                for (var [RangeOp, ...range_keys] of ranges) {
                    const result = build(RangeOp, range_keys);
                    if (result === false) {
                        return;
                    }
                    if (!result) {
                        continue;
                    }
                    op_keys.delete('$gt');
                    op_keys.delete('$gte');
                    op_keys.delete('$lt');
                    op_keys.delete('$lte');
                    break;
                }
                return true;
            };
            buildClause = (parent_args, path, params) => {
                const withoutOps = () => {
                    parent_args.push(new Equal(path, params));
                    return true;
                };
                if (params == null || params.constructor !== Object) {
                    return withoutOps();
                }
                const op_keys = new Set(Object.keys(params));
                if (op_keys.has('$exists') && !params.$exists) {
                    parent_args.push(new Exists(path, false));
                    return true;
                }
                const new_args = [];
                if (op_keys.has('$eq')) {
                    new_args.push(new Equal(path, params.$eq));
                    op_keys.delete('$eq');
                }
                if (op_keys.has('$ne')) {
                    new_args.push(new NotEqual(path, params.$ne));
                    op_keys.delete('$ne');
                }
                if (!buildRange(new_args, path, params, op_keys)) {
                    return false;
                }
                if (op_keys.has('$in')) {
                    const eqs = [];
                    for (var value of params.$in) {
                        eqs.push(new Equal(path, value));
                    }
                    if (eqs.length > 1) {
                        new_args.push(new Disjunction(eqs));
                    }
                    else if (eqs.length) {
                        new_args.push(eqs[0]);
                    }
                    op_keys.delete('$in');
                }
                if (op_keys.has('$nin')) {
                    for (var value of params.$nin) {
                        new_args.push(new NotEqual(path, value));
                    }
                    op_keys.delete('$nin');
                }
                if (op_keys.has('$elemMatch')) {
                    const op = build(params.$elemMatch);
                    if (op) {
                        new_args.push(new ElemMatch(path, op));
                    }
                    op_keys.delete('$elemMatch');
                }
                if (op_keys.has('$regex')) {
                    const expr = new RegExp(params.$regex, params.$options);
                    new_args.push(new RegEx(path, expr));
                    op_keys.delete('$regex');
                    op_keys.delete('$options');
                }
                if (params.$exists && !new_args.length) {
                    new_args.push(new Exists(path, true));
                    op_keys.delete('$exists');
                }
                for (var name of op_keys) {
                    if (name[0] === '$') {
                        util_4.unknownOp(name);
                    }
                }
                if (!new_args.length) {
                    return withoutOps();
                }
                parent_args.push(...new_args);
                return true;
            };
            exports_9("build", build = (expr) => {
                const args = [];
                for (var field in expr) {
                    let value = expr[field], result;
                    if (field[0] !== '$') {
                        result = buildClause(args, new path_1.default(field), value);
                    }
                    else {
                        if (!Array.isArray(value)) {
                            value = [value];
                        }
                        const fn = connectives[field];
                        if (!fn) {
                            util_4.unknownOp(field);
                        }
                        result = fn(args, value);
                    }
                    if (!result) {
                        return result;
                    }
                }
                if (!args.length) {
                    return;
                }
                if (args.length === 1) {
                    return args[0];
                }
                return new Conjunction(args);
            });
        }
    };
});
System.register("providers/gangodb_core/create_next_fn", ["deepmerge", "providers/gangodb_core/util", "providers/gangodb_core/filter", "providers/gangodb_core/sort", "providers/gangodb_core/lang/filter"], function (exports_10, context_10) {
    "use strict";
    var __moduleName = context_10 && context_10.id;
    var deepmerge_2, util_5, filter_1, sort_1, filter_2, toIDBDirection, joinPredicates, removeClause, openConn, getIDBReqWithIndex, getIDBReqWithoutIndex, buildPredicates, initPredAndSortSpec, getClauses, initClauses, initHint, initSort, createGetIDBReqFn, createGetIDBCurFn, addPipelineStages, createParallelNextFn, createNextFn;
    return {
        setters: [
            function (deepmerge_2_1) {
                deepmerge_2 = deepmerge_2_1;
            },
            function (util_5_1) {
                util_5 = util_5_1;
            },
            function (filter_1_1) {
                filter_1 = filter_1_1;
            },
            function (sort_1_1) {
                sort_1 = sort_1_1;
            },
            function (filter_2_1) {
                filter_2 = filter_2_1;
            }
        ],
        execute: function () {
            toIDBDirection = value => (value > 0 ? "next" : "prev");
            joinPredicates = preds => {
                if (preds.length > 1) {
                    return new filter_2.Conjunction(preds);
                }
                return preds[0];
            };
            removeClause = ({ parent, index }) => {
                parent && parent.args && parent.args.splice(index, 1);
            };
            openConn = ({ col, read_pref }, cb) => {
                col._db.conn.then(idb => {
                    const name = col._name;
                    try {
                        const trans = idb.transaction([name], read_pref);
                        trans.onerror = e => cb(util_5.getIDBError(e));
                        cb(null, trans.objectStore(name));
                    }
                    catch (error) {
                        cb(error);
                    }
                }, cb);
            };
            getIDBReqWithIndex = (store, clause) => {
                const key_range = clause.idb_key_range || null, direction = clause.idb_direction || "next", { literal } = clause.path;
                let index;
                if (literal === "_id") {
                    index = store;
                }
                else {
                    index = store.index(literal);
                }
                return index.openCursor(key_range, direction);
            };
            getIDBReqWithoutIndex = store => store.openCursor();
            buildPredicates = pipeline => {
                const new_pipeline = [];
                for (var [fn, arg] of pipeline) {
                    if (fn === filter_1.default) {
                        const pred = filter_2.build(arg);
                        if (pred === false) {
                            return;
                        }
                        if (!pred) {
                            continue;
                        }
                        arg = pred;
                    }
                    new_pipeline.push([fn, arg]);
                }
                return new_pipeline;
            };
            initPredAndSortSpec = config => {
                const { pipeline } = config;
                const preds = [];
                const sort_specs = [];
                let i = 0;
                for (var [fn, arg] of pipeline) {
                    if (fn === sort_1.default) {
                        sort_specs.push(arg);
                    }
                    else if (fn === filter_1.default) {
                        preds.push(arg);
                    }
                    else {
                        break;
                    }
                    i++;
                }
                pipeline.splice(0, i);
                config.pred = joinPredicates(preds);
                if (sort_specs.length) {
                    config.sort_spec = sort_specs.reduce(deepmerge_2.default, {});
                }
            };
            getClauses = (col, pred) => {
                if (!pred) {
                    return [];
                }
                const clauses = [];
                const exists_clauses = [];
                for (var clause of pred.getClauses()) {
                    if (col._isIndexed(clause.path.literal)) {
                        if (clause instanceof filter_2.Exists) {
                            exists_clauses.push(clause);
                        }
                        else {
                            clauses.push(clause);
                        }
                    }
                }
                if (clauses.length) {
                    return clauses;
                }
                return exists_clauses;
            };
            initClauses = config => {
                const { col, pred } = config;
                config.clauses = getClauses(col, pred);
            };
            initHint = config => {
                if (!config.hint) {
                    return;
                }
                const { clauses, hint } = config;
                let new_clauses = [];
                for (var clause of clauses) {
                    if (clause.path.literal === hint) {
                        new_clauses.push(clause);
                    }
                }
                if (!new_clauses.length) {
                    new_clauses = [{ path: { literal: hint } }];
                }
                config.clauses = new_clauses;
            };
            initSort = config => {
                if (!config.sort_spec) {
                    return;
                }
                const { clauses, sort_spec: spec, pipeline } = config;
                const new_clauses = [];
                for (var clause of clauses) {
                    const { literal } = clause.path;
                    if (!spec.hasOwnProperty(literal)) {
                        continue;
                    }
                    const order = spec[literal];
                    clause.idb_direction = toIDBDirection(order);
                    new_clauses.push(clause);
                }
                if (new_clauses.length === 0) {
                    const literal = spec ? Object.keys(spec)[0] : null;
                    if (literal) {
                        new_clauses.push({
                            // idb_key_range
                            path: { literal },
                            idb_direction: toIDBDirection(spec[literal]),
                        });
                    }
                }
                if (new_clauses.length) {
                    config.clauses = new_clauses;
                }
                else {
                    pipeline.unshift([sort_1.default, spec]);
                }
            };
            createGetIDBReqFn = ({ pred, clauses, pipeline }) => {
                let getIDBReq;
                if (clauses.length) {
                    const clause = clauses[0];
                    getIDBReq = store => getIDBReqWithIndex(store, clause);
                    if (!pred || clause === pred) {
                        return getIDBReq;
                    }
                    removeClause(clause);
                }
                else {
                    getIDBReq = getIDBReqWithoutIndex;
                    if (!pred) {
                        return getIDBReq;
                    }
                }
                pipeline.unshift([filter_1.default, pred]);
                return getIDBReq;
            };
            createGetIDBCurFn = config => {
                let idb_cur, idb_req;
                const getIDBReq = createGetIDBReqFn(config);
                const onIDBCur = cb => {
                    idb_req.onsuccess = e => {
                        idb_cur = e.target.result;
                        cb();
                    };
                    idb_req.onerror = e => cb(util_5.getIDBError(e));
                };
                const progressCur = cb => {
                    onIDBCur(cb);
                    idb_cur.continue();
                };
                let getCur = cb => {
                    openConn(config, (error, store) => {
                        if (error) {
                            return cb(error);
                        }
                        idb_req = getIDBReq(store);
                        onIDBCur(error => {
                            if (idb_cur) {
                                getCur = progressCur;
                            }
                            cb(error);
                        });
                    });
                };
                return cb => getCur(error => cb(error, idb_cur));
            };
            addPipelineStages = ({ pipeline }, next) => {
                for (var [fn, arg] of pipeline) {
                    next = fn(next, arg);
                }
                return next;
            };
            createParallelNextFn = config => {
                const next_fns = [], pred_args = config.pred.args;
                for (var i = pred_args.length - 1; i >= 0; i--) {
                    const new_config = {
                        col: config.col,
                        read_pref: config.read_pref,
                        pred: pred_args[i],
                        pipeline: [],
                    };
                    initClauses(new_config);
                    const next = createNextFn(new_config);
                    next_fns.push(addPipelineStages(new_config, next));
                }
                const _id_hashes = new Set();
                const onDoc = doc => {
                    const _id_hash = util_5.hashify(doc._id);
                    if (!_id_hashes.has(_id_hash)) {
                        return _id_hashes.add(_id_hash);
                    }
                };
                const getNextFn = () => next_fns.pop();
                let currentNextFn = getNextFn();
                const changeNextFn = cb => {
                    if ((currentNextFn = getNextFn())) {
                        next(cb);
                    }
                    else {
                        cb();
                    }
                };
                const next = cb => {
                    currentNextFn((error, doc, idb_cur) => {
                        if (error) {
                            cb(error);
                        }
                        else if (!doc) {
                            changeNextFn(cb);
                        }
                        else if (onDoc(doc)) {
                            cb(null, doc, idb_cur);
                        }
                        else {
                            next(cb);
                        }
                    });
                };
                const spec = config.sort_spec;
                if (spec) {
                    config.pipeline.push([sort_1.default, spec]);
                }
                return next;
            };
            createNextFn = config => {
                const getIDBCur = createGetIDBCurFn(config);
                const next = cb => {
                    getIDBCur((error, idb_cur) => {
                        if (!idb_cur) {
                            cb(error);
                        }
                        else {
                            cb(null, idb_cur.value, idb_cur);
                        }
                    });
                };
                return next;
            };
            exports_10("default", cur => {
                let pipeline;
                try {
                    pipeline = buildPredicates(cur._pipeline);
                }
                catch (error) {
                    return cb => cb(error);
                }
                if (!pipeline) {
                    return cb => cb();
                }
                const config = {
                    col: cur._col,
                    read_pref: cur._read_pref,
                    hint: cur._hint,
                    pipeline,
                    pred: undefined,
                };
                initPredAndSortSpec(config);
                let next;
                if (config.pred instanceof filter_2.Disjunction) {
                    next = createParallelNextFn(config);
                }
                else {
                    initClauses(config);
                    initHint(config);
                    initSort(config);
                    next = createNextFn(config);
                }
                return addPipelineStages(config, next);
            });
        }
    };
});
System.register("providers/gangodb_core/lang/expression", ["providers/gangodb_core/util", "providers/gangodb_core/lang/missing_symbol", "providers/gangodb_core/lang/path"], function (exports_11, context_11) {
    "use strict";
    var __moduleName = context_11 && context_11.id;
    var util_6, missing_symbol_3, path_2, Value, NumberValue, StringValue, ArrayValue, DateValue, Literal, Get, ObjectExpr, Operator, FnOp, UnaryFnOp, fnOp, opTypes, ArithOp, arithOp, Add, Subtract, Multiply, Divide, Mod, MathOp, mathOp, Abs, Ceil, Floor, Ln, Log10, Pow, Sqrt, Trunc, StringConcatOp, Concat, CaseOp, ToLower, ToUpper, ConcatArraysOp, ConcatArrays, DateOp, dateOp, DayOfMonth, Year, Month, Hour, Minute, Second, Millisecond, TypeCond, PopFromStack, ops, buildOp, buildObject, build;
    return {
        setters: [
            function (util_6_1) {
                util_6 = util_6_1;
            },
            function (missing_symbol_3_1) {
                missing_symbol_3 = missing_symbol_3_1;
            },
            function (path_2_1) {
                path_2 = path_2_1;
            }
        ],
        execute: function () {
            Value = class Value {
                constructor(value) {
                    this.value = value;
                }
                get ResultType() { return this.constructor; }
                static any(value) {
                    if (typeof value === 'number') {
                        return new NumberValue(value);
                    }
                    if (typeof value === 'string') {
                        return new StringValue(value);
                    }
                    if (Array.isArray(value)) {
                        return new ArrayValue(value);
                    }
                    if (value instanceof Date) {
                        return new DateValue(value);
                    }
                    return new Value(value);
                }
                static literal(value) {
                    return new Literal(Value.any(value));
                }
                run(fields) { return this.value; }
            };
            NumberValue = class NumberValue extends Value {
                static isType(value) { return typeof value === 'number'; }
            };
            StringValue = class StringValue extends Value {
                static isType(value) { return typeof value === 'string'; }
            };
            ArrayValue = class ArrayValue extends Value {
                static isType(value) { return Array.isArray(value); }
            };
            DateValue = class DateValue extends Value {
                static isType(value) { return value instanceof Date; }
            };
            Literal = class Literal extends Value {
                get ResultType() { return this.value.ResultType; }
                run() { return this.value.run(); }
            };
            Get = class Get {
                constructor(path) {
                    this.path = path;
                }
                run(fields) {
                    const value = fields.get(this.path);
                    return value === missing_symbol_3.default ? null : value;
                }
            };
            ObjectExpr = class ObjectExpr extends Value {
                run(fields) {
                    const result = {}, { value } = this;
                    for (var field in value) {
                        result[field] = value[field].run(fields);
                    }
                    return result;
                }
            };
            Operator = class Operator {
                constructor() {
                    this.args = [];
                }
                get alt() { return new Value(null); }
                add(node) { this.args.push(node); }
            };
            FnOp = class FnOp extends Operator {
                constructor(fn /* : (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T */) {
                    super();
                    this.fn /* : (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T */ = fn;
                }
                get length() { return Infinity; }
                run(fields) {
                    const { args, fn } = this;
                    return args.map(arg => arg.run(fields)).reduce(fn);
                }
            };
            UnaryFnOp = class UnaryFnOp extends FnOp {
                get length() { return 1; }
                run(fields) { return this.fn(this.args[0].run(fields)); }
            };
            fnOp = (Parent, fn) => {
                return class extends Parent {
                    constructor() { super(fn); }
                };
            };
            opTypes = (Parent, InputType, ResultType = InputType) => {
                const OpConstructor = class extends Parent {
                    constructor() {
                        super(...arguments);
                        this.InputType = InputType;
                        this.ResultType = ResultType;
                    }
                };
                return OpConstructor;
            };
            ArithOp = class ArithOp extends opTypes(FnOp, NumberValue) {
            };
            arithOp = fn => fnOp(ArithOp, fn);
            Add = class Add extends arithOp((a, b) => a + b) {
            };
            Subtract = class Subtract extends arithOp((a, b) => a - b) {
            };
            Multiply = class Multiply extends arithOp((a, b) => a * b) {
            };
            Divide = class Divide extends arithOp((a, b) => a / b) {
            };
            Mod = class Mod extends arithOp((a, b) => a % b) {
            };
            MathOp = class MathOp extends opTypes(FnOp, NumberValue) {
                get length() { return this.fn.length; }
                run(fields) {
                    return this.fn(...this.args.map(arg => arg.run(fields)));
                }
            };
            mathOp = fn => fnOp(MathOp, fn);
            Abs = class Abs extends mathOp(Math.abs) {
            };
            Ceil = class Ceil extends mathOp(Math.ceil) {
            };
            Floor = class Floor extends mathOp(Math.floor) {
            };
            Ln = class Ln extends mathOp(Math.log) {
            };
            Log10 = class Log10 extends mathOp(Math.log10) {
            };
            Pow = class Pow extends mathOp(Math.pow) {
            };
            Sqrt = class Sqrt extends mathOp(Math.sqrt) {
            };
            Trunc = class Trunc extends mathOp(Math.trunc) {
            };
            StringConcatOp = class StringConcatOp extends opTypes(FnOp, StringValue) {
            };
            Concat = class Concat extends fnOp(StringConcatOp, (a, b) => a + b) {
            };
            CaseOp = class CaseOp extends opTypes(UnaryFnOp, StringValue) {
                get alt() { return new StringValue(''); }
            };
            ToLower = class ToLower extends fnOp(CaseOp, s => s.toLowerCase()) {
            };
            ToUpper = class ToUpper extends fnOp(CaseOp, s => s.toUpperCase()) {
            };
            ConcatArraysOp = class ConcatArraysOp extends opTypes(FnOp, ArrayValue) {
            };
            ConcatArrays = class ConcatArrays extends fnOp(ConcatArraysOp, (a, b) => a.concat(b)) {
            };
            DateOp = class DateOp extends opTypes(UnaryFnOp, DateValue, NumberValue) {
            };
            dateOp = fn => fnOp(DateOp, fn);
            DayOfMonth = class DayOfMonth extends dateOp(d => d.getDate()) {
            };
            Year = class Year extends dateOp(d => d.getUTCFullYear()) {
            };
            Month = class Month extends dateOp(d => d.getUTCMonth() + 1) {
            };
            Hour = class Hour extends dateOp(d => d.getUTCHours()) {
            };
            Minute = class Minute extends dateOp(d => d.getUTCMinutes()) {
            };
            Second = class Second extends dateOp(d => d.getUTCSeconds()) {
            };
            Millisecond = class Millisecond extends dateOp(d => d.getUTCMilliseconds()) {
            };
            TypeCond = class TypeCond {
                constructor(stack, args, op) {
                    this.stack = stack;
                    this.args = args;
                    this.op = op;
                    const { InputType, alt } = op;
                    this.result_types = new Set([op.ResultType, alt.ResultType]);
                    this.isType = InputType.isType;
                    this.alt_value = alt.value;
                }
                run(fields) {
                    const { stack, isType, op } = this;
                    const new_args = [];
                    for (var arg of this.args) {
                        const result = arg.run(fields);
                        if (!isType(result)) {
                            return this.alt_value;
                        }
                        new_args.push(result);
                    }
                    for (var i = new_args.length - 1; i >= 0; i--) {
                        stack.push(new_args[i]);
                    }
                    return op.run(fields);
                }
            };
            PopFromStack = class PopFromStack {
                constructor(stack) {
                    this.stack = stack;
                }
                run() { return this.stack.pop(); }
            };
            ops = {
                $add: Add,
                $subtract: Subtract,
                $multiply: Multiply,
                $divide: Divide,
                $mod: Mod,
                $abs: Abs,
                $ceil: Ceil,
                $floor: Floor,
                $ln: Ln,
                $log10: Log10,
                $pow: Pow,
                $sqrt: Sqrt,
                $trunc: Trunc,
                $concat: Concat,
                $toLower: ToLower,
                $toUpper: ToUpper,
                $concatArrays: ConcatArrays,
                $dayOfMonth: DayOfMonth,
                $year: Year,
                $month: Month,
                $hour: Hour,
                $minute: Minute,
                $second: Second,
                $millisecond: Millisecond
            };
            buildOp = (paths, name, args) => {
                const Op = ops[name];
                if (!Op) {
                    util_6.unknownOp(name);
                }
                if (!Array.isArray(args)) {
                    args = [args];
                }
                const op = new Op();
                const tc_nodes = [];
                const new_paths = [];
                const stack = [];
                for (var i = 0; i < args.length && i < op.length; i++) {
                    const arg = build(new_paths, args[i]);
                    if (arg.ResultType) {
                        if (arg.ResultType !== op.InputType) {
                            return op.alt;
                        }
                        op.add(arg);
                        continue;
                    }
                    if (arg instanceof TypeCond) {
                        if (!arg.result_types.has(op.InputType)) {
                            return op.alt;
                        }
                        if (arg.result_types.size === 1) {
                            op.add(arg);
                            continue;
                        }
                    }
                    tc_nodes.push(arg);
                    op.add(new PopFromStack(stack));
                }
                if (!new_paths.length) {
                    return new op.ResultType(op.run());
                }
                paths.push(...new_paths);
                if (!tc_nodes.length) {
                    return op;
                }
                return new TypeCond(stack, tc_nodes, op);
            };
            buildObject = (paths, expr) => {
                const op_names = new Set(), fields = new Set();
                for (var field in expr) {
                    (field[0] === '$' ? op_names : fields).add(field);
                }
                if (op_names.size > 1) {
                    throw Error('objects cannot have more than one operator');
                }
                if (op_names.size) {
                    for (var path of fields) {
                        throw Error(`unexpected field '${path}'`);
                    }
                    for (var name of op_names) {
                        if (name === '$literal') {
                            return Value.literal(expr[name]);
                        }
                        return buildOp(paths, name, expr[name]);
                    }
                }
                const new_paths = [], obj = {};
                for (var field in expr) {
                    obj[field] = build(new_paths, expr[field]);
                }
                const node = new ObjectExpr(obj);
                if (!new_paths.length) {
                    return new Value(node.run());
                }
                paths.push(...new_paths);
                return node;
            };
            build = (paths, expr) => {
                if (typeof expr === 'string' && expr[0] === '$') {
                    const path = new path_2.default(expr.substring(1));
                    paths.push(path);
                    return new Get(path);
                }
                if (expr == null || expr.constructor !== Object) {
                    return Value.any(expr);
                }
                return buildObject(paths, expr);
            };
            exports_11("default", (expr) => {
                const paths = [], ast = build(paths, expr);
                return {
                    ast,
                    paths,
                    has_refs: !!paths.length
                };
            });
        }
    };
});
System.register("providers/gangodb_core/project", ["providers/gangodb_core/util", "providers/gangodb_core/lang/expression", "providers/gangodb_core/lang/fields"], function (exports_12, context_12) {
    "use strict";
    var __moduleName = context_12 && context_12.id;
    function project(_next, spec) {
        const toBool = path => !!spec[path];
        let _id_bool = true;
        if (spec.hasOwnProperty("_id")) {
            _id_bool = toBool("_id");
            delete spec._id;
        }
        const existing_fields = [];
        const new_fields = [];
        let is_inclusion = true;
        const _mode = path => {
            if (toBool(path) !== is_inclusion) {
                throw Error("cannot mix inclusions and exclusions");
            }
        };
        let mode = path => {
            is_inclusion = toBool(path);
            mode = _mode;
        };
        for (var path in spec) {
            const value = spec[path];
            const path_pieces = util_7.toPathPieces(path);
            if (typeof value === "boolean" || value === 1 || value === 0) {
                mode(path);
                existing_fields.push(path_pieces);
            }
            else {
                new_fields.push([path_pieces, _build(value)]);
            }
        }
        const steps = [];
        if (new_fields.length) {
            steps.push((doc, new_doc) => {
                return addition(doc, new_doc, new_fields);
            });
        }
        if (!existing_fields.length) {
            let project;
            if (_id_bool) {
                project = (doc, new_doc) => {
                    if (doc.hasOwnProperty("_id")) {
                        new_doc._id = doc._id;
                    }
                };
            }
            else {
                project = (doc, new_doc) => {
                    delete new_doc._id;
                };
            }
            steps.push((doc, new_doc) => {
                project(doc, new_doc);
                return new_doc;
            });
        }
        else {
            if (is_inclusion === _id_bool) {
                existing_fields.push(["_id"]);
            }
            const project = is_inclusion ? util_7.copy : util_7.remove2;
            steps.push(doc => project(doc, existing_fields));
        }
        const next = cb => {
            _next((error, doc) => {
                if (!doc) {
                    return cb(error);
                }
                let new_doc = doc;
                for (var fn of steps) {
                    new_doc = fn(doc, new_doc);
                }
                cb(null, new_doc);
            });
        };
        return next;
    }
    exports_12("default", project);
    var util_7, expression_1, fields_3, addition, _build;
    return {
        setters: [
            function (util_7_1) {
                util_7 = util_7_1;
            },
            function (expression_1_1) {
                expression_1 = expression_1_1;
            },
            function (fields_3_1) {
                fields_3 = fields_3_1;
            }
        ],
        execute: function () {
            addition = (doc, new_doc, new_fields) => {
                for (var [path_pieces, add] of new_fields) {
                    add(doc, new_doc, path_pieces);
                }
                return new_doc;
            };
            _build = value1 => {
                const { ast, paths, has_refs } = expression_1.default(value1);
                if (!has_refs) {
                    const value2 = ast.run();
                    return (doc, obj, path_pieces) => util_7.set(obj, path_pieces, value2);
                }
                return (doc, obj, path_pieces) => {
                    const fields = new fields_3.default(doc);
                    if (fields.ensure(paths)) {
                        util_7.set(obj, path_pieces, ast.run(fields));
                    }
                };
            };
        }
    };
});
System.register("providers/gangodb_core/group", ["memoizee", "providers/gangodb_core/util", "providers/gangodb_core/lang/expression", "providers/gangodb_core/lang/fields"], function (exports_13, context_13) {
    "use strict";
    var __moduleName = context_13 && context_13.id;
    var memoize, util_8, expression_2, fields_4, Operator, Sum, Avg, Compare, Min, Max, Push, AddToSet, runSteps, runInEnd, groupLoopFn, createGroupByRefFn, createGroupFn, ops, _build;
    return {
        setters: [
            function (memoize_1) {
                memoize = memoize_1;
            },
            function (util_8_1) {
                util_8 = util_8_1;
            },
            function (expression_2_1) {
                expression_2 = expression_2_1;
            },
            function (fields_4_1) {
                fields_4 = fields_4_1;
            }
        ],
        execute: function () {
            Operator = class Operator {
                get value() {
                    return this._value;
                }
                static getNoRefsSteps(steps) {
                    return steps.in_iter;
                }
                static getOpValue(expr, cb) {
                    cb(expr.ast.run());
                }
                getOpValueWithRefs(expr, doc, cb) {
                    const { ast, fields } = expr;
                    cb(ast.run(fields));
                }
            };
            Sum = class Sum extends Operator {
                constructor() {
                    super();
                    this._value = 0;
                }
                static _verify(value, cb) {
                    if (typeof value === "number") {
                        cb(value);
                    }
                }
                static getOpValue(expr, cb) {
                    super.getOpValue(expr, value => Sum._verify(value, cb));
                }
                getOpValueWithRefs(expr, doc, cb) {
                    super.getOpValueWithRefs(expr, doc, value => {
                        Sum._verify(value, cb);
                    });
                }
                add(value) {
                    this._value += value;
                }
            };
            Avg = class Avg extends Sum {
                constructor() {
                    super(...arguments);
                    this._count = 0;
                }
                add(value) {
                    this._count++;
                    super.add(value);
                }
                get value() {
                    return this._value / this._count || 0;
                }
            };
            Compare = class Compare extends Operator {
                constructor(_fn) {
                    super();
                    this._fn = _fn;
                    this._value = null;
                    this._add = this._add1;
                }
                static getNoRefsSteps(steps) {
                    return steps.in_end;
                }
                _add1(value) {
                    this._value = value;
                    this._add = this._add2;
                }
                _add2(new_value) {
                    if (this._fn(new_value, this._value)) {
                        this._value = new_value;
                    }
                }
                add(value) {
                    if (value != null) {
                        this._add(value);
                    }
                }
            };
            Min = class Min extends Compare {
                constructor() {
                    super((a, b) => a < b);
                }
            };
            Max = class Max extends Compare {
                constructor() {
                    super((a, b) => a > b);
                }
            };
            Push = class Push extends Operator {
                constructor() {
                    super();
                    this._value = [];
                }
                add(value) {
                    this._value.push(value);
                }
            };
            AddToSet = class AddToSet extends Operator {
                constructor() {
                    super();
                    this._hashes = {};
                }
                static getNoRefsSteps(steps) {
                    return steps.in_end;
                }
                add(value) {
                    this._hashes[util_8.hashify(value)] = value;
                }
                get value() {
                    const docs = [];
                    for (var hash in this._hashes) {
                        docs.push(this._hashes[hash]);
                    }
                    return docs;
                }
            };
            runSteps = (steps, ...args) => {
                for (var fn of steps) {
                    fn(...args);
                }
            };
            runInEnd = (in_end, groups) => {
                for (var group_doc of groups) {
                    runSteps(in_end, group_doc);
                }
            };
            groupLoopFn = (next, in_end, groups, fn) => cb => {
                const done = error => {
                    if (!error) {
                        runInEnd(in_end, groups);
                    }
                    cb(error, groups);
                };
                (function iterate() {
                    next((error, doc) => {
                        if (!doc) {
                            return done(error);
                        }
                        fn(doc);
                        iterate();
                    });
                })();
            };
            createGroupByRefFn = (next, expr, steps) => {
                const { in_start, in_iter, in_end } = steps;
                const groups = [];
                const add = memoize((_id_hash, _id) => {
                    const group_doc = { _id };
                    groups.push(group_doc);
                    runSteps(in_start, group_doc);
                    return group_doc;
                }, { length: 1 });
                const { ast } = expr;
                const _idFn = doc => ast.run(new fields_4.default(doc));
                let onDoc;
                if (in_iter.length) {
                    onDoc = doc => {
                        const _id = _idFn(doc);
                        const group_doc = add(util_8.hashify(_id), _id);
                        runSteps(in_iter, group_doc, doc);
                    };
                }
                else {
                    onDoc = doc => {
                        const _id = _idFn(doc);
                        add(util_8.hashify(_id), _id);
                    };
                }
                return groupLoopFn(next, in_end, groups, onDoc);
            };
            createGroupFn = (next, expr, steps) => {
                if (expr.has_refs) {
                    return createGroupByRefFn(next, expr, steps);
                }
                const { in_start, in_iter, in_end } = steps;
                const groups = [];
                const initGroupDoc = () => {
                    const group_doc = { _id: expr.ast.run() };
                    runSteps(in_start, group_doc);
                    groups.push(group_doc);
                    return group_doc;
                };
                if (in_iter.length) {
                    const add = memoize(() => initGroupDoc());
                    return groupLoopFn(next, in_end, groups, doc => {
                        runSteps(in_iter, add(), doc);
                    });
                }
                return cb => {
                    next((error, doc) => {
                        if (doc) {
                            initGroupDoc();
                            runInEnd(in_end, groups);
                        }
                        cb(error, groups);
                    });
                };
            };
            ops = {
                $sum: Sum,
                $avg: Avg,
                $min: Min,
                $max: Max,
                $push: Push,
                $addToSet: AddToSet,
            };
            _build = (steps, field, value) => {
                const { in_start, in_iter, in_end } = steps;
                const op_strs = Object.keys(value);
                if (op_strs.length > 1) {
                    throw Error(`fields must have only one operator`);
                }
                const op_str = op_strs[0], Op = ops[op_str];
                if (!Op) {
                    if (op_str[0] === "$") {
                        util_8.unknownOp(op_str);
                    }
                    throw Error(`unexpected field '${op_str}'`);
                }
                const expr = expression_2.default(value[op_str]);
                in_start.push(group_doc => {
                    group_doc[field] = new Op(expr);
                });
                if (expr.has_refs) {
                    in_iter.push((group_doc, doc) => {
                        const fields = new fields_4.default(doc);
                        if (!fields.ensure(expr.paths)) {
                            return;
                        }
                        const op = group_doc[field], _expr = Object.assign({ fields }, expr), add = value => op.add(value);
                        op.getOpValueWithRefs(_expr, doc, add);
                    });
                }
                else {
                    Op.getOpValue(expr, value => {
                        Op.getNoRefsSteps(steps).push(group_doc => {
                            group_doc[field].add(value);
                        });
                    });
                }
                in_end.push(group_doc => {
                    group_doc[field] = group_doc[field].value;
                });
            };
            exports_13("default", (_next, spec) => {
                if (!spec.hasOwnProperty("_id")) {
                    throw Error("the '_id' field is missing");
                }
                const expr = expression_2.default(spec._id);
                const new_spec = Object.assign({}, spec);
                delete new_spec._id;
                const steps = {
                    in_start: [],
                    in_iter: [],
                    in_end: [],
                };
                for (var field in new_spec) {
                    _build(steps, field, new_spec[field]);
                }
                const group = createGroupFn(_next, expr, steps);
                let next = cb => {
                    group((error, groups) => {
                        if (error) {
                            cb(error);
                        }
                        else {
                            (next = cb => cb(null, groups.pop()))(cb);
                        }
                    });
                };
                return cb => next(cb);
            });
        }
    };
});
System.register("providers/gangodb_core/unwind", ["providers/gangodb_core/util"], function (exports_14, context_14) {
    "use strict";
    var __moduleName = context_14 && context_14.id;
    var util_9;
    return {
        setters: [
            function (util_9_1) {
                util_9 = util_9_1;
            }
        ],
        execute: function () {
            exports_14("default", (_next, path) => {
                const path_pieces = util_9.toPathPieces(path.substring(1));
                const elements = [];
                const fn = cb => cb(null, elements.pop());
                const onDoc = (doc, cb) => {
                    const old_length = elements.length;
                    util_9.get(doc, path_pieces, (obj, field) => {
                        const new_elements = obj[field];
                        if (!new_elements) {
                            return;
                        }
                        if (new_elements[Symbol.iterator]) {
                            for (var element of new_elements) {
                                elements.push({ [field]: element });
                            }
                        }
                    });
                    if (old_length === elements.length) {
                        return next(cb);
                    }
                    fn(cb);
                };
                let next = (cb) => {
                    _next((error, doc) => {
                        if (error) {
                            cb(error);
                        }
                        else if (doc) {
                            onDoc(doc, cb);
                        }
                        else {
                            (next = fn)(cb);
                        }
                    });
                };
                return cb => next(cb);
            });
        }
    };
});
System.register("providers/gangodb_core/skip", [], function (exports_15, context_15) {
    "use strict";
    var __moduleName = context_15 && context_15.id;
    function skip(_next, num) {
        let count = 0;
        const next = cb => {
            _next((error, doc) => {
                if (!doc) {
                    cb(error);
                }
                else if (++count > num) {
                    cb(null, doc);
                }
                else {
                    next(cb);
                }
            });
        };
        return next;
    }
    exports_15("default", skip);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("providers/gangodb_core/limit", [], function (exports_16, context_16) {
    "use strict";
    var __moduleName = context_16 && context_16.id;
    function limit(_next, num) {
        let count = 0;
        const next = cb => {
            if (count++ < num) {
                _next(cb);
            }
            else {
                cb();
            }
        };
        return next;
    }
    exports_16("default", limit);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("providers/gangodb_core/cursor", ["events", "q", "providers/gangodb_core/create_next_fn", "providers/gangodb_core/filter", "providers/gangodb_core/project", "providers/gangodb_core/group", "providers/gangodb_core/unwind", "providers/gangodb_core/sort", "providers/gangodb_core/skip", "providers/gangodb_core/limit"], function (exports_17, context_17) {
    "use strict";
    var __moduleName = context_17 && context_17.id;
    var events_1, Q, create_next_fn_1, filter_3, project_1, group_1, unwind_1, sort_2, skip_1, limit_1, Cursor;
    return {
        setters: [
            function (events_1_1) {
                events_1 = events_1_1;
            },
            function (Q_1) {
                Q = Q_1;
            },
            function (create_next_fn_1_1) {
                create_next_fn_1 = create_next_fn_1_1;
            },
            function (filter_3_1) {
                filter_3 = filter_3_1;
            },
            function (project_1_1) {
                project_1 = project_1_1;
            },
            function (group_1_1) {
                group_1 = group_1_1;
            },
            function (unwind_1_1) {
                unwind_1 = unwind_1_1;
            },
            function (sort_2_1) {
                sort_2 = sort_2_1;
            },
            function (skip_1_1) {
                skip_1 = skip_1_1;
            },
            function (limit_1_1) {
                limit_1 = limit_1_1;
            }
        ],
        execute: function () {
            /**
             * Cursor data event.
             * @event Cursor#data
             * @type {object}
             */
            /**
             * Cursor end event.
             * @event Cursor#end
             */
            /**
             * Class representing a query cursor.
             * <strong>Note:</strong> The filter, limit, skip, project, group,
             * unwind and sort, methods each add an additional stage to the
             * cursor pipeline and thus do not override any previous invocations.
             */
            Cursor = class Cursor extends events_1.EventEmitter {
                constructor(col, read_pref) {
                    super();
                    this._opened = false;
                    this._col = col;
                    this._read_pref = read_pref;
                    this._pipeline = [];
                    this._next = this._init;
                }
                _forEach(fn, cb) {
                    this._next((error, doc) => {
                        if (doc) {
                            fn(doc);
                            this.emit('data', doc);
                            this._forEach(fn, cb);
                        }
                        else {
                            this.emit('end');
                            cb(error);
                        }
                    });
                }
                /**
                 * Iterate over each document and apply a function.
                 * @param {function} [fn] The function to apply to each document.
                 * @param {function} [cb] The result callback.
                 * @return {Promise}
                 *
                 * @example
                 * col.find().forEach((doc) => {
                 *     console.log('doc:', doc);
                 * }, (error) => {
                 *     if (error) { throw error; }
                 * });
                 */
                forEach(fn = () => { }, cb) {
                    const deferred = Q.defer();
                    this._forEach(fn, (error) => {
                        if (error) {
                            deferred.reject(error);
                        }
                        else {
                            deferred.resolve();
                        }
                    });
                    deferred.promise.nodeify(cb);
                    return deferred.promise;
                }
                _toArray(cb) {
                    const docs = [];
                    this._forEach((doc) => {
                        docs.push(doc);
                    }, error => cb(error, docs));
                }
                /**
                 * Collect all documents as an array.
                 * @param {function} [cb] The result callback.
                 * @return {Promise}
                 *
                 * @example
                 * col.find().toArray((error, docs) => {
                 *     if (error) { throw error; }
                 *
                 *     for (var doc of docs) {
                 *         console.log('doc:', doc);
                 *     }
                 * });
                 */
                toArray(cb) {
                    const deferred = Q.defer();
                    this._toArray((error, docs) => {
                        if (error) {
                            deferred.reject(error);
                        }
                        else {
                            deferred.resolve(docs);
                        }
                    });
                    deferred.promise.nodeify(cb);
                    return deferred.promise;
                }
                _assertUnopened() {
                    if (this._opened) {
                        throw Error('cursor has already been opened');
                    }
                }
                /**
                 * Suggest an index to use.
                 * <strong>Note:</strong> When an index hint is used only documents
                 * that contain the indexed path will be in the results.
                 * @param {string} path An indexed path to use.
                 * @return {Cursor}
                 *
                 * @example
                 * col.find().hint('myindex');
                 */
                hint(path) {
                    this._assertUnopened();
                    if (!this._col._isIndexed(path)) {
                        throw Error(`index '${path}' does not exist`);
                    }
                    this._hint = path;
                    return this;
                }
                _addStage(fn, arg) {
                    this._assertUnopened();
                    this._pipeline.push([fn, arg]);
                    return this;
                }
                /**
                 * Filter documents.
                 * @param {object} expr The query document to filter by.
                 * @return {Cursor}
                 *
                 * @example
                 * col.find().filter({ x: 4 });
                 */
                filter(expr) { return this._addStage(filter_3.default, expr); }
                /**
                 * Limit the number of documents that can be iterated.
                 * @param {number} num The limit.
                 * @return {Cursor}
                 *
                 * @example
                 * col.find().limit(10);
                 */
                limit(num) { return this._addStage(limit_1.default, num); }
                /**
                 * Skip over a specified number of documents.
                 * @param {number} num The number of documents to skip.
                 * @return {Cursor}
                 *
                 * @example
                 * col.find().skip(4);
                 */
                skip(num) { return this._addStage(skip_1.default, num); }
                /**
                 * Add new fields, and include or exclude pre-existing fields.
                 * @param {object} spec Specification for projection.
                 * @return {Cursor}
                 *
                 * @example
                 * col.find().project({ _id: 0, x: 1, n: { $add: ['$k', 4] } });
                 */
                project(spec) { return this._addStage(project_1.default, spec); }
                /**
                 * Group documents by an _id and optionally add computed fields.
                 * @param {object} spec Specification for grouping documents.
                 * @return {Cursor}
                 *
                 * @example
                 * col.find().group({
                 *     _id: '$author',
                 *     books: { $push: '$book' },
                 *     count: { $sum: 1 }
                 * });
                 */
                group(spec) { return this._addStage(group_1.default, spec); }
                /**
                 * Deconstruct an iterable and output a document for each element.
                 * @param {string} path A path to an iterable to unwind.
                 * @return {Cursor}
                 *
                 * @example
                 * col.find().unwind('$elements');
                 */
                unwind(path) { return this._addStage(unwind_1.default, path); }
                /**
                 * Sort documents.
                 * <strong>Note:</strong> An index will not be used for sorting
                 * unless the query predicate references one of the fields to
                 * sort by or {@link Cursor#hint} is used. This is so as not to exclude
                 * documents that do not contain the indexed field, in accordance
                 * with the functionality of MongoDB.
                 * @param {object} spec Specification for sorting.
                 * @return {Cursor}
                 *
                 * @example
                 * // No indexes will be used for sorting.
                 * col.find().sort({ x: 1 });
                 *
                 * @example
                 * // If x is indexed, it will be used for sorting.
                 * col.find({ x: { $gt: 4 } }).sort({ x: 1 });
                 *
                 * @example
                 * // If x is indexed, it will be used for sorting.
                 * col.find().sort({ x: 1 }).hint('x');
                 */
                sort(spec) { return this._addStage(sort_2.default, spec); }
                _init(cb) {
                    this._opened = true;
                    this._next = create_next_fn_1.default(this);
                    this._next(cb);
                }
            };
            exports_17("default", Cursor);
        }
    };
});
System.register("providers/gangodb_core/aggregate", ["providers/gangodb_core/util", "providers/gangodb_core/cursor"], function (exports_18, context_18) {
    "use strict";
    var __moduleName = context_18 && context_18.id;
    var util_10, cursor_1, ops, getStageObject;
    return {
        setters: [
            function (util_10_1) {
                util_10 = util_10_1;
            },
            function (cursor_1_1) {
                cursor_1 = cursor_1_1;
            }
        ],
        execute: function () {
            ops = {
                $match: (cur, doc) => cur.filter(doc),
                $project: (cur, spec) => cur.project(spec),
                $group: (cur, spec) => cur.group(spec),
                $unwind: (cur, path) => cur.unwind(path),
                $sort: (cur, spec) => cur.sort(spec),
                $skip: (cur, num) => cur.skip(num),
                $limit: (cur, num) => cur.limit(num)
            };
            getStageObject = (doc) => {
                const op_keys = Object.keys(doc);
                if (op_keys.length > 1) {
                    throw Error('stages must be passed only one operator');
                }
                const op_key = op_keys[0], fn = ops[op_key];
                if (!fn) {
                    util_10.unknownOp(op_key);
                }
                return [fn, doc[op_key]];
            };
            exports_18("default", (col, pipeline) => {
                const cur = new cursor_1.default(col, 'readonly');
                for (var doc of pipeline) {
                    const [fn, arg] = getStageObject(doc);
                    fn(cur, arg);
                }
                return cur;
            });
        }
    };
});
System.register("providers/gangodb_core/update", ["providers/gangodb_core/util"], function (exports_19, context_19) {
    "use strict";
    var __moduleName = context_19 && context_19.id;
    var util_11, modifyOp, arithOp, compareOp, build, ops;
    return {
        setters: [
            function (util_11_1) {
                util_11 = util_11_1;
            }
        ],
        execute: function () {
            modifyOp = (path_pieces, update, init) => doc => {
                util_11.modify(doc, path_pieces, update, init);
            };
            arithOp = fn => (path_pieces, value1) => {
                const update = (obj, field) => {
                    const value2 = obj[field];
                    if (typeof value2 === "number") {
                        obj[field] = fn(value1, value2);
                    }
                };
                const init = (obj, field) => (obj[field] = 0);
                return modifyOp(path_pieces, update, init);
            };
            compareOp = fn => (path_pieces, value) => {
                const update = (obj, field) => {
                    if (fn(value, obj[field])) {
                        obj[field] = value;
                    }
                };
                const init = (obj, field) => (obj[field] = value);
                return modifyOp(path_pieces, update, init);
            };
            build = (steps, field, value) => {
                if (field[0] !== "$") {
                    return steps.push(ops.$set(util_11.toPathPieces(field), value));
                }
                const op = ops[field];
                if (!op) {
                    util_11.unknownOp(field);
                }
                for (var path in value) {
                    steps.push(op(util_11.toPathPieces(path), value[path]));
                }
            };
            ops = {
                $set: (path_pieces, value) => doc => {
                    util_11.set(doc, path_pieces, value);
                },
                $unset: path_pieces => doc => util_11.remove1(doc, path_pieces),
                $rename: (path_pieces, new_name) => doc => {
                    util_11.rename(doc, path_pieces, new_name);
                },
                $inc: arithOp((a, b) => a + b),
                $mul: arithOp((a, b) => a * b),
                $min: compareOp((a, b) => a < b),
                $max: compareOp((a, b) => a > b),
                $push: (path_pieces, value) => {
                    const update = (obj, field) => {
                        const elements = obj[field];
                        if (Array.isArray(elements)) {
                            elements.push(value);
                        }
                    };
                    const init = (obj, field) => (obj[field] = [value]);
                    return modifyOp(path_pieces, update, init);
                },
                $pop: (path_pieces, direction) => {
                    let pop;
                    if (direction < 1) {
                        pop = e => e.shift();
                    }
                    else {
                        pop = e => e.pop();
                    }
                    return doc => {
                        util_11.get(doc, path_pieces, (obj, field) => {
                            const elements = obj[field];
                            if (Array.isArray(elements)) {
                                pop(elements);
                            }
                        });
                    };
                },
                $pullAll: (path_pieces, values) => doc => {
                    util_11.get(doc, path_pieces, (obj, field) => {
                        const elements = obj[field];
                        if (!Array.isArray(elements)) {
                            return;
                        }
                        const new_elements = [];
                        const hasValue = value1 => {
                            for (var value2 of values) {
                                if (util_11.equal(value1, value2)) {
                                    return true;
                                }
                            }
                        };
                        for (var element of elements) {
                            if (!hasValue(element)) {
                                new_elements.push(element);
                            }
                        }
                        obj[field] = new_elements;
                    });
                },
                $pull: (path_pieces, value) => {
                    return ops.$pullAll(path_pieces, [value]);
                },
                $addToSet: (path_pieces, value) => doc => {
                    util_11.get(doc, path_pieces, (obj, field) => {
                        const elements = obj[field];
                        if (!Array.isArray(elements)) {
                            return;
                        }
                        for (var element of elements) {
                            if (util_11.equal(element, value)) {
                                return;
                            }
                        }
                        elements.push(value);
                    });
                },
            };
            exports_19("default", (cur, spec, cb) => {
                const steps = [];
                for (var field in spec) {
                    build(steps, field, spec[field]);
                }
                if (!steps.length) {
                    return cb(null);
                }
                var update_num = 0;
                (function iterate() {
                    cur._next((error, doc, idb_cur) => {
                        if (!doc) {
                            return cb(error, update_num);
                        }
                        for (var fn of steps) {
                            fn(doc);
                        }
                        update_num += 1;
                        const idb_req = idb_cur.update(doc);
                        idb_req.onsuccess = iterate;
                        idb_req.onerror = e => cb(util_11.getIDBError(e));
                    });
                })();
            });
        }
    };
});
System.register("providers/gangodb_core/remove", ["providers/gangodb_core/util"], function (exports_20, context_20) {
    "use strict";
    var __moduleName = context_20 && context_20.id;
    function remove(cur, cb) {
        var remove_num = 0;
        (function iterate() {
            cur._next((error, doc, idb_cur) => {
                if (!doc) {
                    return cb(error, remove_num);
                }
                remove_num += 1;
                const idb_req = idb_cur.delete();
                idb_req.onsuccess = iterate;
                idb_req.onerror = e => cb(util_12.getIDBError(e));
            });
        })();
    }
    exports_20("default", remove);
    var util_12;
    return {
        setters: [
            function (util_12_1) {
                util_12 = util_12_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("providers/gangodb_core/collection", ["q", "providers/gangodb_core/util", "providers/gangodb_core/cursor", "providers/gangodb_core/aggregate", "providers/gangodb_core/update", "providers/gangodb_core/remove"], function (exports_21, context_21) {
    "use strict";
    var __moduleName = context_21 && context_21.id;
    var Q, util_13, cursor_2, aggregate_1, update_1, remove_1, Collection;
    return {
        setters: [
            function (Q_2) {
                Q = Q_2;
            },
            function (util_13_1) {
                util_13 = util_13_1;
            },
            function (cursor_2_1) {
                cursor_2 = cursor_2_1;
            },
            function (aggregate_1_1) {
                aggregate_1 = aggregate_1_1;
            },
            function (update_1_1) {
                update_1 = update_1_1;
            },
            function (remove_1_1) {
                remove_1 = remove_1_1;
            }
        ],
        execute: function () {
            /** Class representing a collection. */
            Collection = class Collection {
                constructor(_db, _name) {
                    this._db = _db;
                    this._name = _name;
                    /** <strong>Note:</strong> Do not instantiate directly. */
                    this._indexes = new Set();
                }
                /**
                 * The name of the collection.
                 * @type {string}
                 */
                get name() {
                    return this._name;
                }
                _isIndexed(path) {
                    return this._indexes.has(path) || path === "_id";
                }
                /**
                 * Open a cursor that satisfies the specified query criteria.
                 * @param {object} [expr] The query document to filter by.
                 * @param {object} [projection_spec] Specification for projection.
                 * @return {Cursor}
                 *
                 * @example
                 * col.find({ x: 4, g: { $lt: 10 } }, { k: 0 });
                 */
                find(expr, projection_spec) {
                    const cur = new cursor_2.default(this, "readonly");
                    cur.filter(expr);
                    if (projection_spec) {
                        cur.project(projection_spec);
                    }
                    return cur;
                }
                /**
                 * Retrieve one document that satisfies the specified query criteria.
                 * @param {object} [expr] The query document to filter by.
                 * @param {object} [projection_spec] Specification for projection.
                 * @param {function} [cb] The result callback.
                 * @return {Promise}
                 *
                 * @example
                 * col.findOne({ x: 4, g: { $lt: 10 } }, { k: 0 });
                 */
                findOne(expr, projection_spec, cb) {
                    if (typeof projection_spec === "function") {
                        cb = projection_spec;
                        projection_spec = null;
                    }
                    const deferred = Q.defer();
                    const cur = this.find(expr, projection_spec).limit(1);
                    cur.toArray((error, docs) => {
                        if (error) {
                            deferred.reject(error);
                        }
                        else {
                            deferred.resolve(docs[0]);
                        }
                    });
                    deferred.promise.nodeify(cb);
                    return deferred.promise;
                }
                /**
                 * Evaluate an aggregation framework pipeline.
                 * @param {object[]} pipeline The pipeline.
                 * @return {Cursor}
                 *
                 * @example
                 * col.aggregate([
                 *     { $match: { x: { $lt: 8 } } },
                 *     { $group: { _id: '$x', array: { $push: '$y' } } },
                 *     { $unwind: '$array' }
                 * ]);
                 */
                aggregate(pipeline) {
                    return aggregate_1.default(this, pipeline);
                }
                _validate(doc) {
                    for (var field in doc) {
                        if (field[0] === "$") {
                            throw Error("field name cannot start with '$'");
                        }
                        const value = doc[field];
                        if (Array.isArray(value)) {
                            for (var element of value) {
                                this._validate(element);
                            }
                        }
                        else if (typeof value === "object") {
                            this._validate(value);
                        }
                    }
                }
                /**
                 * @param {object|object[]} docs Documents to insert.
                 * @param {function} [cb] The result callback.
                 * @return {Promise}
                 *
                 * @example
                 * col.insert([{ x: 4 }, { k: 8 }], (error) => {
                 *     if (error) { throw error; }
                 * });
                 *
                 * @example
                 * col.insert({ x: 4 }, (error) => {
                 *     if (error) { throw error; }
                 * });
                 */
                insert(docs, cb) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (!Array.isArray(docs)) {
                            docs = [docs];
                        }
                        const deferred = Q.defer();
                        this._db.conn.then((idb) => __awaiter(this, void 0, void 0, function* () {
                            let trans;
                            const name = this._name;
                            try {
                                trans = idb.transaction([name], "readwrite");
                            }
                            catch (error) {
                                return deferred.reject(error);
                            }
                            trans.oncomplete = () => deferred.resolve();
                            trans.onerror = e => deferred.reject(util_13.getIDBError(e));
                            const store = trans.objectStore(name);
                            for (var _doc of docs) {
                                const doc = _doc;
                                yield new Promise((resolve, reject) => {
                                    this._validate(doc);
                                    const req = store.add(doc);
                                    req.onsuccess = resolve;
                                }).catch(e => deferred.reject(util_13.getIDBError(e)));
                            }
                        }), cb);
                        deferred.promise.nodeify(cb);
                        return deferred.promise;
                    });
                }
                _modify(fn, expr, cb) {
                    const deferred = Q.defer();
                    const cur = new cursor_2.default(this, "readwrite");
                    cur.filter(expr);
                    fn(cur, (error, res) => {
                        if (error) {
                            deferred.reject(error);
                        }
                        else {
                            deferred.resolve(res);
                        }
                    });
                    deferred.promise.nodeify(cb);
                    return deferred.promise;
                }
                /**
                 * Update documents that match a filter.
                 * @param {object} expr The query document to filter by.
                 * @param {object} spec Specification for updating.
                 * @param {function} [cb] The result callback.
                 * @return {Promise}
                 *
                 * @example
                 * col.update({
                 *     age: { $gte: 18 }
                 * }, {
                 *     adult: true
                 * }, (error) => {
                 *     if (error) { throw error; }
                 * });
                 */
                update(expr, spec, cb) {
                    const fn = (cur, cb) => update_1.default(cur, spec, cb);
                    return this._modify(fn, expr, cb);
                }
                /**
                 * Delete documents that match a filter.
                 * @param {object} expr The query document to filter by.
                 * @param {function} [cb] The result callback.
                 * @return {Promise}
                 *
                 * @example
                 * col.remove({ x: { $ne: 10 } }, (error) => {
                 *     if (error) { throw error; }
                 * });
                 */
                remove(expr, cb) {
                    return this._modify(remove_1.default, expr, cb);
                }
            };
            exports_21("default", Collection);
        }
    };
});
System.register("providers/gangodb_core/db", ["eventemitter3", "memoizee", "q", "providers/gangodb_core/util", "providers/gangodb_core/collection"], function (exports_22, context_22) {
    "use strict";
    var __moduleName = context_22 && context_22.id;
    var EventEmitter, memoize, Q, util_14, collection_1, Db;
    return {
        setters: [
            function (EventEmitter_2) {
                EventEmitter = EventEmitter_2;
            },
            function (memoize_2) {
                memoize = memoize_2;
            },
            function (Q_3) {
                Q = Q_3;
            },
            function (util_14_1) {
                util_14 = util_14_1;
            },
            function (collection_1_1) {
                collection_1 = collection_1_1;
            }
        ],
        execute: function () {
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
            Db = class Db extends EventEmitter {
                constructor(_name, _version, config = {}) {
                    super();
                    this._name = _name;
                    this._version = _version;
                    this._cols = {};
                    this._config = {};
                    this.conn = (() => {
                        return new Promise((resolve, reject) => {
                            this._getConn((err, conn) => {
                                err ? reject(err) : resolve(conn);
                            });
                        });
                    })();
                    this._open = false;
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
                _addCollection(name) {
                    return (this._cols[name] = new collection_1.default(this, name));
                }
                collection(name) {
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
                    }
                    else {
                        for (var index_keypath in index_config) {
                            if (index_config[index_keypath]) {
                                col._indexes.add(index_keypath);
                            }
                        }
                        config[path] = index_config;
                    }
                }
                _addStore(idb, store_name) {
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
                                }
                                catch (err) {
                                    console.warn(err);
                                }
                            }
                            else {
                                optionParams
                                    .split(",")
                                    .forEach(k => (default_config[k] = true));
                            }
                            store.createIndex(name, keyPath, default_config);
                        }
                        else {
                            store.deleteIndex(name);
                        }
                    }
                }
                _updateStore(trans, store_name) {
                    const store = trans.objectStore(store_name);
                    const index_set = new Set();
                    for (var i = 0; i < store.indexNames.length; i += 1) {
                        index_set.add(store.indexNames[i]);
                    }
                    const index_config = this._config[store_name];
                    for (var name in index_config) {
                        if (index_set.has(name)) {
                            continue;
                        }
                        if (index_config[name]) {
                            const cur_index_config = name.split(":", 1);
                            const default_config = { unique: false };
                            const keyPath = cur_index_config[0];
                            const optionParams = cur_index_config[1] || "";
                            if (optionParams.startsWith("{")) {
                                try {
                                    Object.assign(default_config, JSON.parse(optionParams));
                                }
                                catch (err) {
                                    console.warn(err);
                                }
                            }
                            else {
                                optionParams
                                    .split(",")
                                    .forEach(k => (default_config[k] = true));
                            }
                            store.createIndex(name, keyPath, default_config);
                        }
                        else {
                            store.deleteIndex(name);
                        }
                    }
                }
                /*private */ _getConn(cb) {
                    let req;
                    if (this._version) {
                        req = indexedDB.open(this._name, this._version);
                    }
                    else {
                        req = indexedDB.open(this._name);
                    }
                    req.onsuccess = e => {
                        const idb = e.target.result;
                        this._idb = idb;
                        this._version = idb.version;
                        this._open = true;
                        cb(null, idb);
                    };
                    req.onerror = e => cb(util_14.getIDBError(e));
                    req.onupgradeneeded = e => {
                        const idb = e.target.result;
                        const upgradeTransaction = e.target.transaction;
                        for (var name in this._config) {
                            try {
                                if (!this._config[name]) {
                                    idb.deleteObjectStore(name);
                                }
                                else if (!idb.objectStoreNames.contains(name)) {
                                    this._addStore(idb, name);
                                }
                                else {
                                    this._updateStore(upgradeTransaction, name);
                                }
                            }
                            catch (error) {
                                return cb(error);
                            }
                        }
                    };
                    req.onblocked = () => this.emit("blocked");
                }
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
                        }
                        else {
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
                    req.onerror = e => deferred.reject(util_14.getIDBError(e));
                    deferred.promise.nodeify(cb);
                    return deferred.promise;
                }
            };
            exports_22("default", Db);
        }
    };
});
System.register("providers/mdb", ["bnqkl-framework/helper", "providers/gangodb_core/db"], function (exports_23, context_23) {
    "use strict";
    var __moduleName = context_23 && context_23.id;
    var helper_1, db_1, mdb, Promise_allNoArray, Mdb;
    return {
        setters: [
            function (helper_1_1) {
                helper_1 = helper_1_1;
            },
            function (db_1_1) {
                db_1 = db_1_1;
            }
        ],
        execute: function () {
            mdb = new db_1.default("ibt", 8, {
                blocks: ["height", "id"],
                account: ["address", "publicKey"],
                voted_delegate: true,
                voucher: ["timestamp"],
                contact: ["address", "owner_publicKey"],
                unconfirm_transaction: ["id"],
                contact_tags: ["owner_publicKey", "contact_ids:multiEntry"],
            });
            helper_1.tryRegisterGlobal("mdb", mdb);
            Promise_allNoArray = (async_arr) => {
                let per_task = Promise.resolve([]);
                for (let item of async_arr) {
                    const _per_task = per_task;
                    per_task = item.then(() => _per_task);
                }
                return per_task;
            };
            Mdb = class Mdb {
                constructor(name, inMemoryOnly) {
                    this.name = name;
                    this.db = mdb.collection(name);
                }
                createIndex(fieldOrSpec, options) {
                    // TODO
                    return Promise.resolve(true);
                }
                insert(item) {
                    return this._insert(item);
                }
                insertMany(list) {
                    const async_arr = list.map(item => ({
                        item,
                        task: this._insert(item),
                    }));
                    const errs = [];
                    let per_task = Promise.resolve([]);
                    for (var async_item of async_arr) {
                        const _per_task = per_task;
                        per_task = async_item.task
                            .catch(error => errs.push({ error, item: async_item.item }))
                            .then(() => _per_task);
                    }
                    if (errs.length) {
                        console.error(errs);
                    }
                    return per_task;
                }
                _insert(data) {
                    return new Promise((resolve, reject) => {
                        this.db.insert(data, (err, res) => {
                            if (err) {
                                return reject(err);
                            }
                            resolve(res);
                        });
                    });
                }
                update(query, updateQuery) {
                    return new Promise((resolve, reject) => {
                        this.db.update(query, updateQuery, (err, res) => {
                            if (err) {
                                return reject(err);
                            }
                            resolve(res);
                        });
                    });
                }
                remove(query) {
                    return new Promise((resolve, reject) => {
                        this.db.remove(query, (err, res) => {
                            if (err) {
                                return reject(err);
                            }
                            resolve(res);
                        });
                    });
                }
                findOne(query, cursor_operators = {}) {
                    cursor_operators["limit"] = 1;
                    return this.find(query, cursor_operators).then(res => res[0]);
                }
                find(query, cursor_operators) {
                    return new Promise((resolve, reject) => {
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
                    return this.findOne(query).then(res => !!res);
                }
                clear() {
                    return new Promise((resolve, reject) => {
                        this.db.remove({}, (err, res) => {
                            if (err) {
                                return reject(err);
                            }
                            resolve(res);
                        });
                    });
                }
            };
            exports_23("Mdb", Mdb);
        }
    };
});
System.register("workers/download-block-chain/download-block-chain", ["../../shareProto", "eventemitter3", "bnqkl-framework/PromiseExtends"], function (exports_24, context_24) {
    "use strict";
    var __moduleName = context_24 && context_24.id;
    var shareProto, EventEmitter, PromiseExtends_1, buf2hex, BlockChainDownloader;
    return {
        setters: [
            function (shareProto_1) {
                shareProto = shareProto_1;
            },
            function (EventEmitter_3) {
                EventEmitter = EventEmitter_3;
            },
            function (PromiseExtends_1_1) {
                PromiseExtends_1 = PromiseExtends_1_1;
            }
        ],
        execute: function () {
            ("../../providers/block-service/block-service").BlockModel;
            exports_24("buf2hex", buf2hex = (buffer) => {
                var hex = "";
                const uarr = new Uint8Array(buffer);
                for (var i = 0; i < uarr.length; i += 1) {
                    let char = uarr[i].toString(16);
                    if (char.length === 1) {
                        char = "0" + char;
                    }
                    hex += char;
                }
                return hex;
            });
            BlockChainDownloader = class BlockChainDownloader extends EventEmitter {
                constructor(webio, blockDb) {
                    super();
                    this.webio = webio;
                    this.blockDb = blockDb;
                }
                downloadBlocks(startHeight, endHeight, max_end_height) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (this._download_lock) {
                            return this._download_lock.promise;
                        }
                        this._download_lock = new PromiseExtends_1.PromiseOut();
                        this.emit("start-download");
                        try {
                            yield this._download_with_auto_retry(startHeight, endHeight, max_end_height);
                        }
                        finally {
                            this._download_lock.resolve();
                            this._download_lock = undefined;
                            this.emit("end-download");
                        }
                    });
                }
                _download_with_auto_retry(startHeight, endHeight, max_end_height) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const total = max_end_height - startHeight;
                        const pageSize = 100;
                        var acc_endHeight = endHeight;
                        do {
                            let retry_interval = 1000;
                            try {
                                yield this._download_range_blocks(pageSize, acc_endHeight, startHeight, max_end_height, total);
                                if (acc_endHeight > 1) {
                                    acc_endHeight -= pageSize;
                                    acc_endHeight = Math.max(acc_endHeight, startHeight);
                                }
                                else {
                                    break;
                                }
                            }
                            catch (err) {
                                console.warn(err);
                                retry_interval = Math.min(retry_interval + 1000, 5000);
                                yield PromiseExtends_1.sleep(retry_interval); // 1s~5s 后重试
                            }
                        } while (endHeight > 1);
                    });
                }
                _download_range_blocks(pageSize, acc_endHeight, startHeight, max_end_height, total) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const cur_end_height = acc_endHeight;
                        const cur_start_height = Math.max(cur_end_height - (pageSize - 1), startHeight);
                        const tin_task = new PromiseExtends_1.PromiseOut();
                        // await this.blockService.getBlocksByRange(startHeight, endHeight);
                        this.webio.emit("get/api/blocks/", {
                            startHeight: cur_start_height,
                            endHeight: cur_end_height,
                        }, res => {
                            if (res.success) {
                                tin_task.resolve(res);
                            }
                            else {
                                // prettier-ignore
                                tin_task.reject(Object.assign(new Error("SERVER REJECT"), res));
                            }
                        });
                        PromiseExtends_1.sleep(1000).then(() => tin_task.reject(new Error("TIME OUT")));
                        const { blocks: blocks_array_buffer } = yield tin_task.promise;
                        const blocks_buffer = new Uint8Array(blocks_array_buffer);
                        const blocks = shareProto.PackList.decode(blocks_buffer).list.map(b => {
                            const unpack_block = shareProto.SimpleBlock.decode(b);
                            const block = Object.assign({}, unpack_block, { payloadHash: buf2hex(unpack_block.payloadHash), generatorPublicKey: buf2hex(unpack_block.generatorPublicKey), blockSignature: buf2hex(unpack_block.blockSignature), previousBlock: buf2hex(unpack_block.previousBlock), id: buf2hex(unpack_block.id), remark: new TextDecoder("utf-8").decode(unpack_block.remark) });
                            return block;
                        });
                        // 数据库插入出错的话，忽略错误，继续往下走
                        yield this.blockDb.insertMany(blocks).catch(console.warn);
                        // 更改进度
                        this.emit("progress", ((max_end_height - acc_endHeight) / total) * 100);
                    });
                }
            };
            exports_24("BlockChainDownloader", BlockChainDownloader);
        }
    };
});
System.register("workers/download-block-chain/worker-setup", ["socket.io-client", "workers/download-block-chain/download-block-chain", "providers/mdb"], function (exports_25, context_25) {
    "use strict";
    var __moduleName = context_25 && context_25.id;
    var socketio, download_block_chain_1, mdb_1;
    return {
        setters: [
            function (socketio_1) {
                socketio = socketio_1;
            },
            function (download_block_chain_1_1) {
                download_block_chain_1 = download_block_chain_1_1;
            },
            function (mdb_1_1) {
                mdb_1 = mdb_1_1;
            }
        ],
        execute: function () {
            self.importScripts("./assets/workers/system-production.js");
            onmessage = e => {
                const msg = e.data;
                if (msg && msg.cmd === "download") {
                    const { webio_path, startHeight, endHeight, max_end_height, req_id, } = msg;
                    const webio = socketio(webio_path, {
                        transports: ["websocket"],
                    });
                    const blockDb = new mdb_1.Mdb("blocks");
                    const blockChainDownloader = new download_block_chain_1.BlockChainDownloader(webio, blockDb);
                    blockChainDownloader
                        .downloadBlocks(startHeight, endHeight, max_end_height)
                        .catch(err => {
                        console.error(err);
                        postMessage({
                            req_id,
                            type: "error",
                            data: err instanceof Error ? err.message : err,
                        });
                    });
                    ["start-download", "end-download", "progress"].forEach(eventname => {
                        blockChainDownloader.on(eventname, data => {
                            postMessage({
                                req_id,
                                type: eventname,
                                data,
                            });
                        });
                    });
                }
            };
        }
    };
});
