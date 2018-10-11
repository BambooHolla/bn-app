import socketio from "socket.io-client";
import { BlockChainDownloader } from "./download-block-chain";
import { BlockModel } from "./helper";
// import { Mdb } from "../../src/providers/mdb";
import { BlockDBFactory } from "../../providers/block-service/helper";
import { IfmchainCore } from "../../ifmchain-js-core/src";
import { PromiseOut } from "../../bnqkl-framework/PromiseExtends";
import { EventEmitter } from "eventemitter3";

export class DownloadBlockChainMaster extends EventEmitter {
  constructor() {
    super();
  }
  worker = new DownloadBlockChainWorker(this);
  postMessage(data) {
    this.worker.emit("message", { data });
  }
  private _on_message;
  set onmessage(e) {
    if (this._on_message) {
      this.removeListener("message", this._on_message);
    }
    this._on_message = e;
    this.addListener("message", this._on_message.bind(this));
  }
  get onmessage() {
    return this._on_message;
  }
  addEventListener = this.addListener;
  removeEventListener = this.removeListener;
}
class DownloadBlockChainWorker extends EventEmitter {
  constructor(public master: DownloadBlockChainMaster) {
    super();
    const worker = this;

    function errorFormat(err) {
      console.error(err);
      return err instanceof Error ? err.message : err;
    }

    const blockChainDownloaderCache = new Map<string, Promise<BlockChainDownloader> | BlockChainDownloader>();
    self["blockChainDownloaderCache"] = blockChainDownloaderCache;
    async function getBlockChainDownloader(NET_VERSION, magic, webio_path, startHeight: number, endHeight: number) {
      const id = `${NET_VERSION} ${webio_path} ${startHeight} ${endHeight}`;
      var blockChainDownloader = blockChainDownloaderCache.get(id);
      if (!blockChainDownloader) {
        const BlockChainDownloader_task = new PromiseOut<BlockChainDownloader>();
        blockChainDownloaderCache.set(
          id,
          BlockChainDownloader_task.promise.then(res => {
            blockChainDownloaderCache.set(id, res);
            return res;
          })
        );
        const webio = socketio(webio_path, {
          transports: ["websocket"],
        });
        const blockDb = await BlockDBFactory(magic);
        blockDb["fast"] = () => blockDb;
        const ifmJs = new IfmchainCore(NET_VERSION);
        blockChainDownloader = new BlockChainDownloader(webio, blockDb as any, ifmJs);
        BlockChainDownloader_task.resolve(blockChainDownloader);
      }
      return await blockChainDownloader;
    }

    const cmd_handler = {
      async download({ NET_VERSION, magic, webio_path, startHeight, endHeight, max_end_height, req_id }) {
        const blockChainDownloader = await getBlockChainDownloader(NET_VERSION, magic, webio_path, startHeight, endHeight);

        // 事件注册
        const cgs = ["start-download", "end-download", "progress", "use-flow"].map(eventname => {
          const fun = data => {
            worker.postMessage({
              req_id,
              type: eventname,
              data,
            });
          };
          blockChainDownloader.on(eventname, fun);
          return () => {
            blockChainDownloader.off(eventname, fun);
          };
        });

        const downloader = blockChainDownloader;
        try {
          // 开始发送通知
          return blockChainDownloader.downloadBlocks(startHeight, endHeight, max_end_height);
        } finally {
          cgs.forEach(cg => cg());
        }
      },
      async syncBlockChain({ NET_VERSION, magic, webio_path, max_end_height, req_id,need_verifier }) {
        const blockChainDownloader = await getBlockChainDownloader(NET_VERSION, magic, webio_path, 1, max_end_height);

        // 事件注册
        const cgs = [
          "start-verifier",
          "end-verifier",
          "start-sync",
          "end-sync",
          "start-download",
          "end-download",
          "progress",
          "use-flow",
          "process-height",
        ].map(eventname => {
          const fun = data => {
            worker.postMessage({
              req_id,
              type: eventname,
              data,
            });
          };
          blockChainDownloader.on(eventname, fun);
          return () => {
            blockChainDownloader.off(eventname, fun);
          };
        });

        const downloader = blockChainDownloader;
        try {
          // 开始同步区块链
          return await blockChainDownloader.syncFullBlockchain(max_end_height,need_verifier);
        } finally {
          cgs.forEach(cg => cg());
        }
      },
      async toggleSyncBlocks({ toggle_sync_blocks, req_id }) {
        for (var _downloader_task of blockChainDownloaderCache.values()) {
          const downloader = await _downloader_task;
          if (toggle_sync_blocks) {
            downloader.resume();
          } else {
            downloader.pause();
          }
        }
      },
    };

    this.onmessage = async e => {
      const msg = e.data;
      if (msg && msg.cmd in cmd_handler) {
        const handler = cmd_handler[msg.cmd];
        try {
          const res = await handler(msg);
          this.postMessage({
            type: "return",
            res,
            req_id: msg.req_id,
          });
        } catch (err) {
          this.postMessage({
            type: "error",
            data: errorFormat(err),
            req_id: msg.req_id,
          });
        }
      }
    };
  }
  postMessage(data) {
    this.master.emit("message", { data });
  }
  private _on_message;
  set onmessage(e) {
    if (this._on_message) {
      this.removeListener("message", this._on_message);
    }
    this._on_message = e;
    this.addListener("message", this._on_message.bind(this));
  }
  get onmessage() {
    return this._on_message;
  }
}
