import { Mdb } from "../../providers/mdb";

import {
	buf2hex,
	hex2buf,
	BlockModel,
	BlockListResModel,
	reqToPromise,
	reqCursorLooper,
	BlockChain,
	SKETCHY_CHECK_RES,
} from "./helper";

export class BlockchainVerifier {
	constructor(
		public webio: SocketIOClient.Socket,
		public blockDb: Mdb<BlockModel>,
	) {
		// super();
	}
	ioRequest<T>(path, query) {
		return new Promise<T>((resolve, reject) => {
			this.webio.emit(path, query, res => {
				if (res.success) {
					resolve(res);
				} else {
					reject(res.error || res.message);
				}
			});
		});
	}
	async useableLocalBlockRanges() {
		const all_ranges: {
			startHeight: number;
			endHeight: number;
		}[] = [];
		for await (var _range of this.useableLocalBlocksFinder()) {
			all_ranges.push(..._range);
		}
		return all_ranges;
	}
	// 对本地区块进行检测，返回一串串连续的区块，在这期间会进行去重操作
	async *useableLocalBlocksFinder() {
		const continuousBlockChain = this.continuousBlockChainGenerator();
		for await (var _blockchains of continuousBlockChain) {
			const usable_ranges: {
				startHeight: number;
				endHeight: number;
			}[] = [];
			const blockchains = [..._blockchains.values()];
			const check_tasks = blockchains.map(bc => {
				// TODO: 目前没有提供单区块校验的接口，所以先直接设定为扔掉这个数据
				return bc.size === 1
					? Promise.resolve(bc.slice(0, 0))
					: this.checkBlockChain(bc);
			});
			// 准备清除数据库的工作
			const delete_range = {
				startHeight: Infinity,
				endHeight: -Infinity,
				keep_id_set: new Set(),
			};
			const save_block_chain_list = await Promise.all(check_tasks);
			for (var i = 0; i < check_tasks.length; i += 1) {
				const to_keep_save_block_chain = await check_tasks[i];
				const source_block_chain = blockchains[i];
				if (to_keep_save_block_chain.size) {
					const useable_range = to_keep_save_block_chain.range();
					usable_ranges.push(useable_range);
					if (
						to_keep_save_block_chain.size ===
						source_block_chain.size
					) {
						// 这条数据链是完整的！！
						console.log(
							"%cLOCAL GOOD CHAIN",
							"color:darkgreen;",
							useable_range,
						);
					} else {
						console.log(
							"%cLOCAL INCOMPLETE CHAIN",
							"color:darkorange;",
							useable_range,
							source_block_chain.range(),
						);
					}
					// 把要保留的id存起来
					to_keep_save_block_chain.forEach(b =>
						delete_range.keep_id_set.add(b["_id"]),
					);
				} else {
					const source_range = source_block_chain.range();
					delete_range.startHeight = Math.min(
						source_range.startHeight,
						delete_range.startHeight,
					);
					delete_range.endHeight = Math.max(
						source_range.endHeight,
						delete_range.endHeight,
					);
					console.log(
						"%cLOCAL BAD CHAIN",
						"color:darkred;",
						source_range,
					);
				}
			}
			// 尝试进行删除无用数据
			if (delete_range.endHeight > delete_range.startHeight) {
				await this._IDB_deleteBlocks(
					delete_range.startHeight,
					delete_range.endHeight,
					delete_range.keep_id_set,
				);
			}
			yield usable_ranges;
		}
	}
	getBlockByHeight(height: number) {
		return this.ioRequest<BlockListResModel>("get/api/blocks/", {
			height,
		}).then(res => res.blocks[0]);
	}
	/*获取一片区块的可用范围*/
	async checkBlockChain(blockchain: BlockChain) {
		const res = await this._loop_bigRangeCheckBlocks(blockchain.toArray());
		return blockchain.slice(res.from, res.to);
	}
	/*持续使用小范围校验进行检测，注意，这个方法只适合在已知半错的情况下，才能用这个会比较快*/
	private async _loop_smallRangeCheckBlocks(blocks: BlockModel[], n = 0) {
		const res = { from: 0, to: 0 };
		do {
			const checkResult = await this._smallRangeCheckBlocks(blocks, n);
			if (checkResult === 0) {
				// 全队，继续匹配
				n += 2;
			} else {
				// 有一个错误的，从错误的前一个来开始校验是否与服务端的id一致
				let may_be_right_index = checkResult - 1 - 1;
				const start_height = blocks[0].height;
				while (may_be_right_index >= 0) {
					const may_be_right_block = await this.getBlockByHeight(
						start_height + may_be_right_index,
					);
					if (
						may_be_right_block.id === blocks[may_be_right_index].id
					) {
						res.to = may_be_right_index + 1;
					}
					may_be_right_index -= 1;
				}
				break;
			}
		} while (n <= 30);
		return res;
	}
	private async _loop_bigRangeCheckBlocks(blocks: BlockModel[]) {
		const res = { from: 0, to: 0 };
		// 先校验全部
		const start_block = blocks[0];
		const all_checkResult = await this._bigRangeCheckBlocks(
			start_block,
			blocks[blocks.length - 1],
		);
		if (all_checkResult === SKETCHY_CHECK_RES.NO) {
			// 全错
		} else if (all_checkResult === SKETCHY_CHECK_RES.YES) {
			//全对
			res.to = blocks.length;
		} else {
			// 半错
			if (blocks.length > 135) {
				const start_half_blocks = blocks.slice(
					0,
					(blocks.length / 2) | 0,
				);
				const start_half_res = await this._loop_bigRangeCheckBlocks(
					start_half_blocks,
				);
				if (start_half_res.to === start_half_blocks.length) {
					//前半部分全对，检测后半部分，最后一个就不用测验了，直接扔掉
					const end_half_blocks = blocks.slice(
						start_half_blocks.length,
						blocks.length - 1,
					);
					const end_half_res = await this._loop_bigRangeCheckBlocks(
						end_half_blocks,
					);
					res.to = start_half_blocks.length + end_half_res.to;
				} else {
					// 前半部分有错，直接返回结果
					Object.assign(res, start_half_res);
				}
			} else {
				Object.assign(
					res,
					await this._loop_smallRangeCheckBlocks(blocks),
				);
			}
		}
		return res;
	}
	/*大范围校验区块*/
	private _bigRangeCheckBlocks(
		start_block: BlockModel,
		end_block: BlockModel,
	) {
		const b = new Uint8Array(80 /*8+8+32+32*/);
		// 注入height1-startHeight
		b.set(new Uint8Array(new Float64Array([start_block.height]).buffer), 0);
		// 注入height2-endHeight
		b.set(new Uint8Array(new Float64Array([end_block.height]).buffer), 8);
		// 注入字符串
		const id1_buf = hex2buf(start_block.id);
		b.set(id1_buf, 16);
		const id2_buf = hex2buf(end_block.id);
		b.set(id2_buf, 16 + id1_buf.length);
		return this.ioRequest<{ checkResult: SKETCHY_CHECK_RES }>(
			"get/api/blocks/sketchyCheck",
			b.buffer,
		)
			.then(res => res.checkResult)
			.catch(() => SKETCHY_CHECK_RES.NO);
	}
	/*小范围校验区块*/
	private _smallRangeCheckBlocks(blocks: BlockModel[], n = 0) {
		const b = new Float32Array(blocks.length + 9 /*8(height)+1(n)*/);
		b.set(new Uint8Array(new Float64Array([blocks[0].height])), 0);
		b.set(new Uint8Array([n]), 8);

		const iddd = blocks.reduce((idd, b) => {
			// b.setUint8(parseInt(b.id.substr(n, 2)), 9 + i);
			return idd + b.id.substr(n, 2);
		}, "");
		b.set(hex2buf(iddd), 9);
		return this.ioRequest<{ checkResult: number }>(
			"get/api/blocks/preciseCheck",
			b.buffer,
		).then(res => res.checkResult);
	}
	/*获取所有的碎片区块链*/
	private async *continuousBlockChainGenerator() {
		let done = false;
		let from = 1;
		const limit = 1096;
		const getQueryTask = (linking_blockchains?: Set<BlockChain>) => {
			const task = this._IDB_getContinuousBlockChain(
				from,
				limit,
				linking_blockchains,
			);
			from += limit;
			return task;
		};
		let cur_query = await getQueryTask();
		do {
			if (cur_query.finished_blockchains.size) {
				yield cur_query.finished_blockchains;
			}
			if (cur_query.done) {
				break;
			}
			const next_query = await getQueryTask(
				cur_query.linking_blockchains,
			);
			cur_query = next_query;
		} while (true);
	}
	/*获取一定范围内的碎片区块链数据，这里使用indexDb的原生写法*/
	private async _IDB_getContinuousBlockChain(
		from = 1,
		limit = 1096,
		linking_blockchains: Set<BlockChain> = new Set(),
	) {
		const idb = await this.blockDb.db._db.conn;
		const trans = idb.transaction(["blocks"], "readwrite");
		const objectStore = trans.objectStore("blocks");
		const index = objectStore.index("height");

		/*预计的最大高度<plan_to*/
		let plan_to = from + limit + 1;
		const key_range = IDBKeyRange.lowerBound(from);
		/*是否已经到数据库的结尾了*/
		let done = true;

		/*会尝试构建多条连续的链，断开的就放到finished（height的差异>=2），还在构建的就放到linking里头*/
		const finished_blockchains: Set<BlockChain> = new Set();
		let per_height: number | undefined;
		const cursor = await reqCursorLooper<BlockModel>(
			index.openCursor(key_range),
			(block, height: number, i) => {
				if (height >= plan_to) {
					plan_to = height; // 可能跳了
					done = false;
					return false;
				}
				let is_linked = false;
				for (var _bc of linking_blockchains.values()) {
					const bc = _bc;
					if (height - bc.last_height > 1) {
						// height的差异>=2，链已经断开。
						linking_blockchains.delete(bc);
						finished_blockchains.add(bc);
					} else {
						if (bc.link(block)) {
							// 如果链入成功，基不需要再处理了
							is_linked = true;
							break;
						}
					}
				}
				if (!is_linked) {
					// 没有找到可连接的链，新开一条链
					linking_blockchains.add(new BlockChain(block));
				}
				return true;
			},
		);
		// 如果已经遍历结束，那么把所有的linking放入finished中
		if (done) {
			for (var _bc of linking_blockchains.values()) {
				finished_blockchains.add(_bc);
			}
			linking_blockchains.clear();
		}
		return {
			linking_blockchains,
			finished_blockchains,
			from,
			plan_to,
			done,
		};
	}
	/*删除一定范围内的碎片区块链数据，这里使用indexDb的原生写法*/
	private async _IDB_deleteBlocks(
		start_height: number,
		end_height: number,
		keep_id_set: Set<typeof IDBCursor.prototype.key>,
	) {
		const idb = await this.blockDb.db._db.conn;
		const trans = idb.transaction(["blocks"], "readwrite");
		const objectStore = trans.objectStore("blocks");
		const index = objectStore.index("height");
		const key_range = IDBKeyRange.bound(start_height, end_height);
		const del_tasks: Promise<void>[] = [];

		await reqCursorLooper<BlockModel>(
			index.openCursor(key_range),
			(block, height: number, cursor, i) => {
				if (!keep_id_set.has(block.id)) {
					del_tasks[del_tasks.length] = reqToPromise(cursor.delete());
				}
				return true;
			},
		);
	}
}
