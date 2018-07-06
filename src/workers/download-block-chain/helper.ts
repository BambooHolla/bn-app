import {
  BlockModel,
  BlockListResModel,
} from "../../providers/block-service/block.types";
export { BlockModel, BlockListResModel };
export type ChainRange = {
  startHeight: number;
  endHeight: number;
};

export const buf2hex = (buffer: ArrayBuffer) => {
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
};
export const hex2buf = (hex: string) => {
  const buffer = new Uint8Array(hex.length / 2);
  for (var i = 0; i < buffer.length; i += 1) {
    buffer[i] = parseInt(hex.substr(i + i, 2), 16);
  }
  return buffer;
};

export const reqToPromise = <T>(req: IDBRequest) =>
  new Promise((onsuccess, onerror) =>
    Object.assign(req, {
      onsuccess,
      onerror,
    }),
  ).then(() => req.result as T);

export const reqCursorLooper = <Val>(
  req: IDBRequest,
  map: (
    value: Val,
    key: typeof IDBCursor.prototype.key,
    cursor: IDBCursorWithValue,
    index: number,
  ) => boolean,
) => {
  let index = 0;
  return new Promise<void>(resolve => {
    req.onsuccess = () => {
      const cursor: IDBCursorWithValue = req.result;
      if (cursor) {
        if (map(cursor.value, cursor.key, cursor, index++)) {
          cursor.continue();
          return;
        }
      }
      resolve();
    };
  });
};

export class BlockChain {
  private _map = new Map<string | number, BlockModel>();
  constructor(public first?: BlockModel) {
    first && this._chainItem(first);
  }
  size = 0;
  last?: BlockModel;
  last_height = 0;
  private _chainItem(b: BlockModel) {
    this._map.set(b.id, b);
    this._map.set(b.height, b);
    this.last = b;
    this.last_height = b.height;
    this.size += 1;
  }
  link(next: BlockModel) {
    if (!this.last) {
      this.first = next;
      this._chainItem(next);
      return true;
    } else if (next.previousBlock == this.last.id) {
      this._chainItem(next);
      return true;
    }
    return false;
  }
  forEach(cb: (block: BlockModel, index: number) => void) {
    let b = this.first;
    let i = 0;
    while (b) {
      cb(b, i++);
      b = this._map.get(b.height + 1);
    }
  }
  map<T>(cb: (block: BlockModel, index: number) => T) {
    const res: T[] = [];
    this.forEach((b, i) => {
      res[res.length] = cb(b, i);
    });
    return res;
  }
  getByIndex(index: number) {
    return this.first && this.getByHeight(this.first.height + index);
  }
  getByHeight(height: number) {
    return this._map.get(height);
  }
  toArray() {
    return this.map(b => b);
  }
  slice(start_index: number, end_index: number) {
    const first_block = this.first;
    const cur_size = this.size;
    const sub_size = Math.min(cur_size, end_index);
    if (sub_size > 0) {
      const sub_bc = new BlockChain(
        first_block && this._map.get(first_block.height + start_index),
      );
      sub_bc.size = sub_size;
      const sub_last_block =
        first_block && this._map.get(first_block.height + sub_size - 1);
      sub_bc.last = sub_last_block;
      sub_bc.last_height = sub_last_block ? sub_last_block.height : 0;
      /*共享_map对象*/
      sub_bc._map = this._map;
      return sub_bc;
    } else {
      return new BlockChain();
    }
  }
  range() {
    return {
      startHeight: this.first ? this.first.height : 0,
      endHeight: this.last ? this.last.height : 0,
    };
  }
}

export enum SKETCHY_CHECK_RES {
  NO = 0,
  HALF = 1,
  YES = 2,
}
