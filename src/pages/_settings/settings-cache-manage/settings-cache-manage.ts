import { Component, Optional, ViewChild } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { PromiseOut } from "../../../bnqkl-framework/PromiseExtends";
import { WaterProgressComponent } from "../../../components/water-progress/water-progress";
import { BytesPipe } from "../../../pipes/bytes/bytes";

import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { Storage } from "@ionic/storage";

@IonicPage({ name: "settings-cache-manage" })
@Component({
  selector: "page-settings-cache-manage",
  templateUrl: "settings-cache-manage.html",
})
export class SettingsCacheManagePage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public storage: Storage,
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  // private stringBytesRange = [
  //   [parseInt("000000", 16), parseInt("00007F", 16)], //1
  //   [parseInt("000080", 16), parseInt("0007FF", 16)], //2
  //   [parseInt("000800", 16), parseInt("00D7FF", 16)], //3
  //   [parseInt("010000", 16), parseInt("10FFFF", 16)], //4
  // ];
  getUTF8ByteSize(str: string) {
    var total = 0;
    for (var i = 0; i < str.length; i += 1) {
      const charCode = str.charCodeAt(i);
      if (charCode <= 0x007f) {
        total += 1;
      } else if (charCode <= 0x07ff) {
        total += 2;
      } else if (charCode <= 0xffff) {
        total += 3;
      } else {
        total += 4;
      }
    }
    return total;
  }
  calcing = true;
  calc_progress = 0;

  private _size_color_config = [
    {
      size: 1024 * 1024, //1MB
      colors: ["51d0f0", "60ebe3", "90f7f1"],
    },
    {
      size: 1024 * 1024 * 50, //50MB
      colors: ["f57f17", "ffb04c", "bc5100"],
    },
    {
      size: 1024 * 1024 * 1024, //1G
      colors: ["ff1744", "ff616f", "c4001d"],
    },
  ];
  size_color_config = this._size_color_config.map((config, i) => {
    return {
      max_size: config.size,
      progress_range: [
        0.5 + i / this._size_color_config.length / 2,
        0.5 + (i + 1) / this._size_color_config.length / 2,
      ],
      lines: config.colors.map((color, i) => ({
        color: parseInt(color, 16),
        alpha: i == 2 ? 0.4 : 0.8,
      })),
    };
  });

  @ViewChild(WaterProgressComponent) water_progress!: WaterProgressComponent;
  // 多次进入只需要计算一次
  private _calc_promise_out?: PromiseOut<void>;
  private _can_calc_ti?: any;
  @SettingsCacheManagePage.willEnter
  async doCalc() {
    if (this._calc_promise_out) {
      return this._calc_promise_out.promise;
    }
    this.calcing = true;
    this.calc_progress = 0;
    const calc_promise_out = (this._calc_promise_out = new PromiseOut());
    try {
      let cache_size = 0;
      const keys = await this.storage.keys();
      await Promise.all(
        keys.map(async key => {
          const data = await this.storage.get(key);
          cache_size += this.getUTF8ByteSize(JSON.stringify(data) || "");
          this.calc_progress += 1 / keys.length;
        }),
      );
      this.calc_progress = 1;
      calc_promise_out.resolve();
      // indexedDB
      const mdbSize = await getDatabaseSize("ibt");

      this.cache_size = cache_size + mdbSize;
      // 等待动画执行完成
      await new Promise(cb => setTimeout(cb, 300));
    } catch (err) {
      calc_promise_out.reject(err);
      this._calc_promise_out = undefined;
    } finally {
      this.calcing = false;
      this._can_calc_ti = setTimeout(() => {
        this._calc_promise_out = undefined;
      }, 6e4); // 一分钟后即可重新计算
    }
  }
  private _cache_size: number = 0;
  get cache_size() {
    return this._cache_size;
  }
  set cache_size(v: number) {
    this._cache_size = v;
    if (
      !this.size_color_config.some((config, i) => {
        if (this.cache_size <= config.max_size) {
          const pre_config =
            i === 0
              ? { ...config, max_size: 0 }
              : this.size_color_config[i - 1];
          const [min_progress, max_progress] = config.progress_range;
          const scale =
            (this._cache_size - pre_config.max_size) /
            (config.max_size - pre_config.max_size);
          this.calc_progress =
            scale * (max_progress - min_progress) + min_progress;
          this.water_progress.lines = config.lines.map((line, i) => {
            const pre_line = pre_config.lines[i];

            const from_color = WaterProgressComponent.toColor(pre_line.color);
            const to_color = WaterProgressComponent.toColor(line.color);
            const res_color = from_color.map(
              (from_v, i) => (from_v + (to_color[i] - from_v) * scale) | 0,
            );
            return {
              ...line,
              color: (res_color[0] << 16) + (res_color[1] << 8) + res_color[2],
            };
          });
          return true;
        }
        return false;
      })
    ) {
      this.calc_progress = 1;
      this.water_progress.lines = this.size_color_config[
        this.size_color_config.length - 1
      ].lines;
    }
  }
  get cache_size_bytes() {
    return this.cache_size === 0
      ? this.getTranslateSync("YOUR_DEVICE_IS_HEALTHY")
      : BytesPipe.transform(this.cache_size);
  }
  cleaing = false;
  async clearCache() {
    clearTimeout(this._can_calc_ti);
    const calc_promise_out = (this._calc_promise_out = new PromiseOut());
    this.calcing = true;
    this.cleaing = true;
    try {
      const total_calc_progress = this.calc_progress;
      const keys = await this.storage.keys();
      await Promise.all(
        keys.map(async key => {
          await this.storage.remove(key);
          this.calc_progress -= total_calc_progress / keys.length;
        }),
      );

      // indexedDB
      await clearDatabase("ibt");

      this.calc_progress = 0;
      // 等待动画执行完成
      await new Promise(cb => setTimeout(cb, 300));
      this.cache_size = 0;
    } catch (err) {
      calc_promise_out.reject(err);
      this._calc_promise_out = undefined;
    } finally {
      this.calcing = false;
      this.cleaing = false;
      this._can_calc_ti = setTimeout(() => {
        this._calc_promise_out = undefined;
      }, 6e4); // 一分钟后即可重新计算
    }
  }
}
const clearTable = function(db, dbName) {
  return new Promise<void>((resolve, reject) => {
    if (db == null) {
      return reject();
    }
    if (!event || !event.target || !event.target["result"]) {
      return reject();
    }
    var size = 0;
    db = event.target["result"];
    var transaction = db
      .transaction([dbName], "readwrite")
      .objectStore(dbName)
      .clear();

    transaction.onsuccess = () => {
      resolve();
    };
    transaction.onerror = err => {
      reject("error in " + dbName + ": " + err);
    };
  });
};
var getTableSize = function(db, dbName) {
  return new Promise<number>((resolve, reject) => {
    if (db == null) {
      return reject();
    }
    if (!event || !event.target || !event.target["result"]) {
      return reject();
    }
    var size = 0;
    db = event.target["result"];
    var transaction = db
      .transaction([dbName])
      .objectStore(dbName)
      .openCursor();

    transaction.onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        var storedObject = cursor.value;
        var json = JSON.stringify(storedObject);
        size += json.length;
        cursor.continue();
      } else {
        resolve(size);
      }
    }.bind(this);
    transaction.onerror = function(err) {
      reject("error in " + dbName + ": " + err);
    };
  });
};
const clearDatabase = function(dbName) {
  var request = indexedDB.open(dbName);
  var db;
  var dbSize = 0;
  request.onerror = function(event) {
    alert("Why didn't you allow my web app to use IndexedDB?!");
  };
  return new Promise<number>(async (resolve, reject) => {
    request.onerror = reject;
    request.onsuccess = function(event) {
      if (!event.target || !event.target["result"]) {
        return reject();
      }
      db = event.target["result"];
      var tableNames = [...db.objectStoreNames];
      (function(tableNames, db) {
        var tableSizeGetters: Promise<void>[] = tableNames.reduce(
          (acc, tableName) => {
            acc.push(clearTable(db, tableName));
            return acc;
          },
          [],
        );

        (Promise.all(tableSizeGetters) as any).then(resolve, reject);
      })(tableNames, db);
    };
  });
};

var getDatabaseSize = function(dbName) {
  var request = indexedDB.open(dbName);
  var db;
  var dbSize = 0;
  request.onerror = function(event) {
    alert("Why didn't you allow my web app to use IndexedDB?!");
  };
  return new Promise<number>((resolve, reject) => {
    request.onerror = reject;
    request.onsuccess = function(event) {
      if (!event.target || !event.target["result"]) {
        return reject();
      }
      db = event.target["result"];
      var tableNames = [...db.objectStoreNames];
      (function(tableNames, db) {
        var tableSizeGetters: Promise<number>[] = tableNames.reduce(
          (acc, tableName) => {
            acc.push(getTableSize(db, tableName));
            return acc;
          },
          [],
        );

        Promise.all(tableSizeGetters).then(sizes => {
          // console.log("--------- " + db.name + " -------------");
          // tableNames.forEach((tableName, i) => {
          //   console.log(
          //     " - " + tableName + "\t: " + humanReadableSize(sizes[i]),
          //   );
          // });
          var total = sizes.reduce(function(acc, val) {
            return acc + val;
          }, 0);

          resolve(total);
          // console.log("TOTAL: " + humanReadableSize(total));
        });
      })(tableNames, db);
    };
  });
};

var humanReadableSize = function(bytes) {
  var thresh = 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }
  var units = ["KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  var u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + " " + units[u];
};
