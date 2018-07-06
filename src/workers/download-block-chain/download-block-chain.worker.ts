import "babel-polyfill";
import socketio from "socket.io-client";
import { BlockChainDownloader, BlockModel } from "./download-block-chain";
import { Mdb } from "../../providers/mdb";
import IFM from "ifmchain-ibt";

onmessage = async e => {
  const msg = e.data;
  if (msg && msg.cmd in cmd_handler) {
    const handler = cmd_handler[msg.cmd];
    try {
      const res = await handler(msg);
      postMessage({
        type: "return",
        res,
        req_id: msg.req_id,
      });
    } catch (err) {
      postMessage({
        type: "error",
        data: errorFormat(err),
        req_id: msg.req_id,
      });
    }
  }
};
function errorFormat(err) {
  console.error(err);
  return err instanceof Error ? err.message : err;
}

const blockChainDownloaderCache = new Map<string, BlockChainDownloader>();
function getBlockChainDownloader(
  NET_VERSION,
  webio_path,
  startHeight: number,
  endHeight: number,
) {
  const id = `${NET_VERSION} ${webio_path} ${startHeight} ${endHeight}`;
  var blockChainDownloader = blockChainDownloaderCache.get(id);
  if (!blockChainDownloader) {
    const webio = socketio(webio_path, {
      transports: ["websocket"],
    });
    const blockDb = new Mdb<BlockModel>("blocks");
    const ifmJs = new IFM(NET_VERSION);
    blockChainDownloader = new BlockChainDownloader(webio, blockDb, ifmJs);
  }
  return blockChainDownloader;
}

const cmd_handler = {
  async download({
    NET_VERSION,
    webio_path,
    startHeight,
    endHeight,
    max_end_height,
    req_id,
  }) {
    const blockChainDownloader = getBlockChainDownloader(
      NET_VERSION,
      webio_path,
      startHeight,
      endHeight,
    );

    // 事件注册
    const cgs = [
      "start-download",
      "end-download",
      "progress",
      "use-flow",
    ].map(eventname => {
      const fun = data => {
        postMessage({
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
      return blockChainDownloader.downloadBlocks(
        startHeight,
        endHeight,
        max_end_height,
      );
    } finally {
      cgs.forEach(cg => cg());
    }
  },
  async syncBlockChain({ NET_VERSION, webio_path, max_end_height, req_id }) {
    const blockChainDownloader = getBlockChainDownloader(
      NET_VERSION,
      webio_path,
      1,
      max_end_height,
    );

    // 事件注册
    const cgs = [
      "start-sync",
      "end-sync",
      "start-download",
      "end-download",
      "progress",
      "use-flow",
      "process-height",
    ].map(eventname => {
      const fun = data => {
        postMessage({
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
      return await blockChainDownloader.syncFullBlockchain(max_end_height);
    } finally {
      cgs.forEach(cg => cg());
    }
  },
};
