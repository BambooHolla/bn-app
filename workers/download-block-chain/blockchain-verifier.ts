// import { Mdb } from "../../src/providers/mdb";
import { FangoDB, FangoDBWorker } from 'fangodb'

import {
	buf2hex,
	hex2buf,
	BlockModel,
	BlockListResModel,
	reqToPromise,
	reqCursorLooper,
	BlockChain,
	SKETCHY_CHECK_RES,
	Range,
} from "./helper";

/*
区块链验证模块中直接耦合了删除错误数据。

TODO: 关于冗余数据，因为区块可以重复下载缓存，在验证的过程中，会查出重复的区块链数据并删除*/

export class BlockchainVerifier {
	constructor(
		public webio: SocketIOClient.Socket,
		public blockDb: FangoDBWorker<BlockModel>,
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
		const all_ranges: Range[] = [];
		for await (var _range of this.useableLocalBlocksFinder()) {
			all_ranges.push(..._range);
		}
		return all_ranges;
	}
	// 对本地区块进行检测，返回一串串连续的区块，在这期间会进行去重操作
	async *useableLocalBlocksFinder() {
		const continuousBlockChain = this.continuousBlockChainGenerator();
		for await (var _blockchains of continuousBlockChain) {
			const usable_ranges: Range[] = [];
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
				rm_id_set: new Set(),
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
					// // 把要保留的id存起来
					// to_keep_save_block_chain.forEach(b =>
					// 	delete_range.keep_id_set.add(b["_id"]),
					// );
				} else {
					const source_range = source_block_chain.range();
					source_block_chain.forEach(b => {
						// 强行删除
						delete_range.rm_id_set.add(b.id);
					});
					delete_range.startHeight = Math.min(
						source_range.start,
						delete_range.startHeight,
					);
					delete_range.endHeight = Math.max(
						source_range.end,
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
			if (delete_range.endHeight >= delete_range.startHeight) {
				console.log(
					"尝试移除",
					delete_range.startHeight,
					delete_range.endHeight,
					"范围内有问题的数据",
				);
				await this._IDB_deleteBlocks(
					delete_range.startHeight,
					delete_range.endHeight,
					delete_range.keep_id_set,
					delete_range.rm_id_set,
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
		const v = new DataView(new ArrayBuffer(80 /*8+8+32+32*/));
		// 注入height1-startHeight
		v.setFloat64(0, start_block.height, true);
		// 注入height2-endHeight
		v.setFloat64(8, end_block.height, true);
		const b = new Uint8Array(v.buffer);
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
		const v = new DataView(
			new ArrayBuffer(blocks.length + 9 /*8(height)+1(n)*/),
		);
		v.setFloat64(0, blocks[0].height, true);
		v.setUint8(8, n);

		blocks.forEach((b, i) => {
			v.setUint8(9 + i, parseInt(b.id.substr(n, 2)));
		});

		return this.ioRequest<{ checkResult: number }>(
			"get/api/blocks/preciseCheck",
			v.buffer,
		).then(res => res.checkResult);
	}
	/*获取所有的碎片区块链*/
	private async *continuousBlockChainGenerator() {
		let done = false;
		let from = 1;
		const limit = 1096;
		const getQueryTask = async (linking_blockchains?: Set<BlockChain>) => {
			const task = await this._IDB_getContinuousBlockChain(
				from,
				limit,
				linking_blockchains,
			);
			from = task.plan_to;
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
	/**获取一定范围内的碎片区块链数据，这里使用indexDb的原生写法*/
	private async _IDB_getContinuousBlockChain(
		from = 1,
		limit = 1096,
		linking_blockchains: Set<BlockChain> = new Set(),
	) {
		const range_blocks = await this.blockDb.find({
			height: { $gte: from }
		}, { limit });
		/**预计的最大高度<plan_to*/
		let plan_to = from + limit + 1;
		/**是否已经到数据库的结尾了*/
		let done = true;
		/**会尝试构建多条连续的链，断开的就放到finished（height的差异>=2），还在构建的就放到linking里头*/
		const finished_blockchains: Set<BlockChain> = new Set();
		range_blocks.every(block => {
			const height = block.height;
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
		});


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
	/**删除一定范围内的碎片区块链数据，这里使用indexDb的原生写法*/
	private async _IDB_deleteBlocks(
		start_height: number,
		end_height: number,
		keep_id_set: Set<string>,
		rm_id_set: Set<string>,
	) {
		for (var rm_id of rm_id_set) {
			await this.blockDb.fast().removeById(rm_id);
		}
	}
}
