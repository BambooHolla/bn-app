import "babel-polyfill";
import socketio from "socket.io-client";
import { BlockChainDownloader, BlockModel } from "./download-block-chain";
import { Mdb } from "../../providers/mdb";

onmessage = e => {
	const msg = e.data;
	if (msg && msg.cmd === "download") {
		const {
			webio_path,
			startHeight,
			endHeight,
			max_end_height,
			req_id,
		} = msg as {
			webio_path: string;
			startHeight: number;
			endHeight: number;
			max_end_height: number;
			req_id: number;
		};
		const webio = socketio(webio_path, {
			transports: ["websocket"],
		});
		const blockDb = new Mdb<BlockModel>("blocks");
		const blockChainDownloader = new BlockChainDownloader(webio, blockDb);
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
