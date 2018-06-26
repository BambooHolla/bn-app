import "babel-polyfill";
import socketio from "socket.io-client";
import { BlockChainDownloader, BlockModel } from "./download-block-chain";
import { Mdb } from "../../providers/mdb";

onmessage = async e => {
  const msg = e.data;
  if (msg && msg.cmd in cmd_handler) {
    const handler = cmd_handler[msg.cmd];
    try {
      await handler(msg);
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

const cmd_handler = {
  download({ webio_path, startHeight, endHeight, max_end_height, req_id }) {
    const webio = socketio(webio_path, {
      transports: ["websocket"],
    });
    const blockDb = new Mdb<BlockModel>("blocks");
    const blockChainDownloader = new BlockChainDownloader(webio, blockDb);

    // 事件注册
    ["start-download", "end-download", "progress"].forEach(eventname => {
      blockChainDownloader.on(eventname, data => {
        postMessage({
          req_id,
          type: eventname,
          data,
        });
      });
    });

    const downloader = blockChainDownloader;
    // 开始发送通知
    return blockChainDownloader.downloadBlocks(
      startHeight,
      endHeight,
      max_end_height,
    );
  },
};
