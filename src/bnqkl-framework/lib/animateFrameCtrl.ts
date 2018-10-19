import { global } from "./globalHelper";

export const afCtrl = new class RafController {
  _raf_id_acc = 0;
  _raf_map = {};
  private _raf_register(callback) {
    this._raf_map[++this._raf_id_acc] = callback;
    if (this._cur_raf_id === null) {
      this._cur_raf_id = this.native_raf(t => {
        const raf_map = this._raf_map;
        this._raf_map = {};
        this._cur_raf_id = null;
        for (var _id in raf_map) {
          const cb = raf_map[_id];
          try {
            cb(t);
          } catch (err) {
            console.error(err);
          }
        }
      });
    }
    return this._raf_id_acc;
  }
  private _raf_unregister(id) {
    delete this._raf_map[id];
    var has_size = false;
    for (var _k in this._raf_map) {
      has_size = true;
      break;
    }
    if (has_size && this._cur_raf_id !== null) {
      this.native_unraf(this._cur_raf_id);
      this._cur_raf_id = null;
    }
  }
  private _cur_raf_id: number | null = null;
  native_raf(callback) {
    const raf = (global["__zone_symbol__requestAnimationFrame"] || global["webkitRequestAnimationFrame"]).bind(global);
    this.native_raf = raf;
    return raf(callback);
  }
  native_unraf(rafId) {
    const caf = (global["__zone_symbol__cancelAnimationFrame"] || global["webkitCancelAnimationFrame"]).bind(global);
    this.native_unraf = caf;
    return caf(rafId);
  }

  raf(callback) {
    return this._raf_register(callback);
  }
  caf(rafId) {
    return this._raf_unregister(rafId);
  }
}();
