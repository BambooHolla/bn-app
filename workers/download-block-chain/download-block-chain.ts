import shareProto from "../../src/shareProto";
import EventEmitter from "eventemitter3";
import { PromiseOut, sleep } from "../../src/bnqkl-framework/PromiseExtends";
import { Mdb } from "../../src/providers/mdb";
import { BlockchainVerifier } from "./blockchain-verifier";

import { buf2hex, BlockModel, RangeHelper } from "./helper";

export class BlockChainDownloader extends EventEmitter {
  constructor(
    public webio: SocketIOClient.Socket,
    public blockDb: Mdb<BlockModel>,
    public ifmJs: any,
  ) {
    super();
  }
  verifier = new BlockchainVerifier(this.webio, this.blockDb);

  private _download_lock?: PromiseOut<void>;
  /**
   * endHeight一般情况下是不等于ownEndHeight的
   * ownEndHeight指的是拥有的最高的height，这个height的block是不下载的
   */
  async downloadBlocks(
    startHeight: number,
    endHeight: number,
    ownEndHeight: number,
    total?: number,
    asc?: boolean,
  ) {
    if (this._download_lock) {
      return this._download_lock.promise;
    }
    this._download_lock = new PromiseOut();
    this.emit("start-download", { startHeight, endHeight, ownEndHeight });

    try {
      if (asc) {
        await this._download_with_auto_retry_asc(
          startHeight,
          endHeight,
          ownEndHeight,
          total,
        );
      } else {
        await this._download_with_auto_retry(
          startHeight,
          endHeight,
          ownEndHeight,
          total,
        );
      }
    } finally {
      this._download_lock.resolve();
      this._download_lock = undefined;

      this.emit("end-download", { startHeight, endHeight, ownEndHeight });
    }
  }
  private async _download_with_auto_retry(
    startHeight: number,
    endHeight: number,
    ownEndHeight: number,
    total?: number,
  ) {
    if (typeof total !== "number") {
      total = ownEndHeight - startHeight + 1;
    }
    const pageSize = 10;
    var acc_endHeight = endHeight;
    // 初始化触发一下当前的进度
    this.emit("progress", ((ownEndHeight - acc_endHeight) / total) * 100);
    do {
      let retry_interval = 1000;
      try {
        await this._download_range_blocks(
          pageSize,
          acc_endHeight,
          startHeight,
          ownEndHeight,
          total,
        );
        if (acc_endHeight > startHeight) {
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
    } while (acc_endHeight > startHeight);
  }
  private async _download_range_blocks(
    pageSize: number,
    acc_endHeight: number,
    startHeight: number,
    ownEndHeight: number,
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
      "get/api/blocks/protobuf",
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
    const blocks: BlockModel[] = [];
    {
      const list = shareProto.PackList.decode(blocks_buffer).list;
      for (var _b of list) {
        const b = _b;
        const unpack_block = shareProto.SimpleBlock.decode(b);
        const generatorPublicKey = buf2hex(unpack_block.generatorPublicKey);
        const block = {
          ...unpack_block,
          // 这里强行转化为string类型，避免错误的发生
          reward: "" + unpack_block.reward,
          totalAmount: "" + unpack_block.totalAmount,
          totalFee: "" + unpack_block.totalFee,
          // 一些hex(0~f)字符串的转化
          payloadHash: buf2hex(unpack_block.payloadHash),
          generatorPublicKey,
          generatorId: this.ifmJs.addressCheck.generateBase58CheckAddress(
            generatorPublicKey,
          ),
          blockSignature: buf2hex(unpack_block.blockSignature),
          previousBlock: buf2hex(unpack_block.previousBlock),
          id: buf2hex(unpack_block.id),
          remark: new TextDecoder("utf-8").decode(unpack_block.remark),
        };
        blocks.push(block);
      }
    }

    // 数据库插入出错的话，忽略错误，继续往下走
    await this.blockDb.insertMany(blocks).catch(console.warn);

    // 更改进度
    this.emit(
      "progress",
      ((ownEndHeight - 1 - cur_start_height) / total) * 100,
    );
    // 统计消耗流量
    this.emit("use-flow", {
      up: 70, // 上传：70+, 平均72
      down: blocks_buffer.length,
    });
  }

  // 升序下载
  private async _download_with_auto_retry_asc(
    startHeight: number,
    endHeight: number,
    ownEndHeight: number,
    total?: number,
  ) {
    if (typeof total !== "number") {
      total = ownEndHeight - startHeight + 1;
    }
    const pageSize = 10;
    var acc_startHeight = startHeight;
    // 初始化触发一下当前的进度
    this.emit("progress", ((acc_startHeight - 1) / total) * 100);
    this.emit("process-height", {
      cursorHeight: Math.max(acc_startHeight - 1, 1),
    });
    do {
      let retry_interval = 1000;
      try {
        await this._download_range_blocks_asc(
          pageSize,
          acc_startHeight,
          endHeight,
          ownEndHeight,
          total,
        );
        if (acc_startHeight < endHeight) {
          /*这里不包含等于的情况，但可以生成等于的情况*/
          acc_startHeight = Math.min(acc_startHeight + pageSize, endHeight);
        } else {
          /*等于情况。在这就进行终结*/
          break;
        }
      } catch (err) {
        console.warn(err);
        retry_interval = Math.min(retry_interval + 1000, 5000);
        await sleep(retry_interval); // 1s~5s 后重试
      }
    } while (acc_startHeight <= endHeight); /*等于的情况，也可以继续进行下载*/
  }

  private async _download_range_blocks_asc(
    pageSize: number,
    acc_startHeight: number,
    endHeight: number,
    ownEndHeight: number,
    total: number,
  ) {
    const cur_start_height = acc_startHeight;
    const cur_end_height = Math.min(
      cur_start_height + (pageSize - 1),
      endHeight,
    );
    const tin_task = new PromiseOut<{ blocks: ArrayBuffer }>();
    // await this.blockService.getBlocksByRange(startHeight, endHeight);
    console.log(
      "cur_start_height",
      cur_start_height,
      "cur_end_height",
      cur_end_height,
    );
    this.webio.emit(
      "get/api/blocks/protobuf",
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
    /*五秒的时间下载区块（1KB左右的数据），下载不下来基本就是断网了*/
    sleep(5000).then(() => tin_task.reject(new Error("TIME OUT")));

    const { blocks: blocks_array_buffer } = await tin_task.promise;

    const blocks_buffer = new Uint8Array(blocks_array_buffer);
    const blocks: BlockModel[] = [];
    {
      const list = shareProto.PackList.decode(blocks_buffer).list;
      for (var _b of list) {
        const b = _b;
        const unpack_block = shareProto.SimpleBlock.decode(b);
        const generatorPublicKey = buf2hex(unpack_block.generatorPublicKey);
        const block = {
          ...unpack_block,
          // 这里强行转化为string类型，避免错误的发生
          reward: "" + unpack_block.reward,
          totalAmount: "" + unpack_block.totalAmount,
          totalFee: "" + unpack_block.totalFee,
          // 一些hex(0~f)字符串的转化
          payloadHash: buf2hex(unpack_block.payloadHash),
          generatorPublicKey,
          generatorId: this.ifmJs.addressCheck.generateBase58CheckAddress(
            generatorPublicKey,
          ),
          blockSignature: buf2hex(unpack_block.blockSignature),
          previousBlock: buf2hex(unpack_block.previousBlock),
          id: buf2hex(unpack_block.id),
          remark: new TextDecoder("utf-8").decode(unpack_block.remark),
        };
        blocks.push(block);
      }
    }

    // 数据库插入出错的话，忽略错误，继续往下走
    await this.blockDb.insertMany(blocks).catch(console.warn);

    // 更改进度
    this.emit("progress", ((cur_end_height + 1) / total) * 100);
    this.emit("process-height", { cursorHeight: cur_end_height + 1 });
    // 统计消耗流量
    this.emit("use-flow", {
      up: 70, // 上传：70+, 平均72
      down: blocks_buffer.length,
    });
  }

  private _sync_id_acc = 0;
  /*同步截止高度的区块链*/
  async syncFullBlockchain(/*range_list:Range[],*/ max_end_height: number) {
    const sync_id = ++this._sync_id_acc;
    const rangeHelper = new RangeHelper(1, max_end_height - 1);
    // 因为现在区块是从1开始下载，所以必然要有1，才需要进行校验，否则直接从头下载到尾
    if (await this.blockDb.has({ height: 1 })) {
      this.emit("start-verifier", { ranges: rangeHelper.ranges });
      for await (var _ranges of this.verifier.useableLocalBlocksFinder()) {
        for (var _range of _ranges) {
          rangeHelper.split(_range.start, _range.end);
        }
      }
      this.emit("end-verifier", { ranges: rangeHelper.ranges });
    }
    this.emit("start-sync", {});
    console.log("download ranges:", rangeHelper.ranges);
    for (var _range of rangeHelper.ranges) {
      const range = _range;
      await this.downloadBlocks(
        range.start,
        range.end,
        max_end_height,
        max_end_height,
        true,
      );
    }
    this.emit("end-sync", {});
    /** TODO:
     * 在已经确保区块链已经完整的情况下，再次运行 useableLocalBlocksFinder，
     * 拿出不是1~max_end_height的数据片，进行删除，因为那些是冗余数据
     */
  }
}
