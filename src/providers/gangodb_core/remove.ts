import { getIDBError } from "./util";

export default function remove(cur, cb) {
  var remove_num = 0;
  (function iterate() {
    cur._next((error, doc, idb_cur) => {
      if (!doc) {
        return cb(error, remove_num);
      }
      remove_num += 1;
      const idb_req = idb_cur.delete();

      idb_req.onsuccess = iterate;
      idb_req.onerror = e => cb(getIDBError(e));
    });
  })();
}
