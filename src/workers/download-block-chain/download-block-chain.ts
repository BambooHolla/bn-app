import * as shareProto from "../../shareProto";
import * as EventEmitter from "eventemitter3";
import { PromiseOut, sleep } from "../../bnqkl-framework/PromiseExtends";
import { Mdb } from "../../providers/mdb";
export type BlockModel = import("../../providers/block-service/block-service").BlockModel;

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

export class BlockChainDownloader extends EventEmitter {
	constructor(
		public webio: SocketIOClient.Socket,
		public blockDb: Mdb<BlockModel>,
	) {
		super();
	}
	private _download_lock?: PromiseOut<void>;
	async downloadBlocks(
		startHeight: number,
		endHeight: number,
		max_end_height: number,
	) {
		if (this._download_lock) {
			return this._download_lock.promise;
		}
		this._download_lock = new PromiseOut();
		this.emit("start-download");

		try {
			await this._download_with_auto_retry(
				startHeight,
				endHeight,
				max_end_height,
			);
		} finally {
			this._download_lock.resolve();
			this._download_lock = undefined;

			this.emit("end-download");
		}
	}
	private async _download_with_auto_retry(
		startHeight: number,
		endHeight: number,
		max_end_height: number,
	) {
		const total = max_end_height - startHeight;
		const pageSize = 100;
		var acc_endHeight = endHeight;
		do {
			let retry_interval = 1000;
			try {
				await this._download_range_blocks(
					pageSize,
					acc_endHeight,
					startHeight,
					max_end_height,
					total,
				);
				if (acc_endHeight > 1) {
					acc_endHeight -= pageSize;
					acc_endHeight = Math.max(acc_endHeight, startHeight);
				} else {
					break;
				}
			} catch (err) {
				console.warn(err);
				retry_interval = Math.min(retry_interval + 1000, 5000);
				await sleep(retry_interval); // 1s~5s 后重试
			}
		} while (endHeight > 1);
	}
	private async _download_range_blocks(
		pageSize: number,
		acc_endHeight: number,
		startHeight: number,
		max_end_height: number,
		total: number,
	) {
		const cur_end_height = acc_endHeight;
		const cur_start_height = Math.max(
			cur_end_height - (pageSize - 1),
			startHeight,
		);
		const tin_task = new PromiseOut<{ blocks: ArrayBuffer }>();
		// await this.blockService.getBlocksByRange(startHeight, endHeight);

		this.webio.emit(
			"get/api/blocks/",
			{
				startHeight: cur_start_height,
				endHeight: cur_end_height,
			},
			res => {
				if (res.success) {
					tin_task.resolve(res);
				} else {
					// prettier-ignore
					tin_task.reject(Object.assign(new Error("SERVER REJECT"), res));
				}
			},
		);

		sleep(1000).then(() => tin_task.reject(new Error("TIME OUT")));

		const { blocks: blocks_array_buffer } = await tin_task.promise;

		const blocks_buffer = new Uint8Array(blocks_array_buffer);
		const blocks = shareProto.PackList.decode(blocks_buffer).list.map(b => {
			const unpack_block = shareProto.SimpleBlock.decode(b);
			const block = {
				...unpack_block,
				payloadHash: buf2hex(unpack_block.payloadHash),
				generatorPublicKey: buf2hex(unpack_block.generatorPublicKey),
				blockSignature: buf2hex(unpack_block.blockSignature),
				previousBlock: buf2hex(unpack_block.previousBlock),
				id: buf2hex(unpack_block.id),
				remark: new TextDecoder("utf-8").decode(unpack_block.remark),
			};
			return block;
		});
		// 数据库插入出错的话，忽略错误，继续往下走
		await this.blockDb.insertMany(blocks).catch(console.warn);

		// 更改进度
		this.emit("progress", ((max_end_height - acc_endHeight) / total) * 100);
	}
}