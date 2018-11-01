import { PromiseOut } from "../../bnqkl-framework/lib/PromiseOut";

import { BlockServiceProvider, BlockModel, formatBlockData } from "./block-service";

import { DownloadBlockChainMaster } from "./download-block-chain.fack-worker";

export class BlockChainSync {
  constructor(public constructor_inited: PromiseOut<BlockServiceProvider>) {
  }

  private _download_worker?: DownloadBlockChainMaster;
  getDownloadWorker() {
    if (!this._download_worker) {
      const download_worker = (this._download_worker = new DownloadBlockChainMaster());
      download_worker.getBlockDB = () => this.constructor_inited.promise.then(blockService => blockService.getBlockDB());

      //#region 绑定区块链同步开关
      const ENABLE_SYNC_PROGRESS_BLOCKS_EVENTNAME = "changed@share_settings.enable_sync_progress_blocks"
      const binding_enable_sync_progress_blocks = is_enable => {
        if (this._download_worker !== download_worker) {
          this.constructor_inited.promise.then(blockService => {
            blockService.appSetting.off(ENABLE_SYNC_PROGRESS_BLOCKS_EVENTNAME, binding_enable_sync_progress_blocks);
          })
          return;
        }
        const req_id = this._download_req_id_acc++;
        download_worker.postMessage({
          cmd: "toggleSyncBlocks",
          toggle_sync_blocks: is_enable,
          req_id,
        });
      }
      this.constructor_inited.promise.then(blockService => {
        blockService.appSetting.on(ENABLE_SYNC_PROGRESS_BLOCKS_EVENTNAME, binding_enable_sync_progress_blocks);
      });
      //#endregion
    }
    return this._download_worker;
  }
  private _download_req_id_acc = 0;
  private _sync_lock?: {
    worker: DownloadBlockChainMaster;
    req_id: number;
    task: PromiseOut<void>;
  };
  async syncBlockChain(max_end_height: number) {
    const blockService = await this.constructor_inited.promise;

    if (this._sync_lock) {
      return this._sync_lock;
    }
    const download_worker = this.getDownloadWorker();
    const req_id = this._download_req_id_acc++;
    let cg;
    const sync_progress_height = blockService.appSetting.share_settings.sync_progress_height;
    const local_sync_block = await (await blockService.getBlockDB()).getByHeight(sync_progress_height);
    let need_verifier = false;
    if (local_sync_block) {
      const server_last_block = await blockService.getBlockByHeight(sync_progress_height);
      need_verifier = server_last_block.id !== local_sync_block.id;
    }
    download_worker.postMessage({
      cmd: "syncBlockChain",
      NET_VERSION: blockService.baseConfig.NET_VERSION,
      webio_path: blockService.fetch.webio.io_url_path,
      magic: blockService.baseConfig.MAGIC,
      max_end_height,
      req_id,
      need_verifier,
      from_height: sync_progress_height,
    });
    const task_name = `同步区块链至:${max_end_height}`;
    const task = new PromiseOut<void>();
    const onmessage = e => {
      const msg = e.data;
      if (msg && msg.req_id === req_id) {
        // console.log("bs", msg);
        switch (msg.type) {
          case "start-verifier":
            blockService.appSetting.share_settings.is_syncing_blocks = true;
            blockService.appSetting.share_settings.sync_is_verifying_block = true;
            break;
          case "end-verifier":
            blockService.appSetting.share_settings.sync_is_verifying_block = false;
            break;
          case "start-sync":
            blockService.appSetting.share_settings.is_syncing_blocks = true;
            blockService.appSetting.share_settings.sync_progress_height = 1;
            console.log("开始同步", task_name);
            break;
          case "start-download":
            console.log("开始子任务", msg.data);
            break;
          case "end-download":
            console.log("完成子任务", msg.data);
            break;
          case "end-sync":
            blockService.appSetting.share_settings.sync_progress_height = blockService.appSetting.getHeight();
            blockService.appSetting.share_settings.sync_progress_blocks = 100;
            blockService.appSetting.share_settings.is_syncing_blocks = false;
            console.log("结束同步", task_name);
            task.resolve();
            break;
          case "process-height":
            blockService.appSetting.share_settings.sync_progress_height = msg.data.cursorHeight;
            break;
          case "use-flow":
            {
              const up_flow = +msg.data.up || 0;
              const down_flow = +msg.data.down || 0;
              blockService.appSetting.share_settings.sync_data_flow += up_flow + down_flow;
              /*更新数据库中的流量使用信息*/
              blockService.peerService.updatePeerFlow(blockService.baseConfig.SERVER_URL, up_flow, down_flow);
            }
            break;
          case "progress":
            // console.log("下载中", task_name, msg.data);
            blockService.appSetting.share_settings.sync_progress_blocks = msg.data;
            blockService.tryEmit("BLOCKCHAIN:CHANGED");
            break;
          case "error":
            blockService.appSetting.share_settings.sync_is_verifying_block = false;
            blockService.appSetting.share_settings.is_syncing_blocks = false;
            console.error(msg);
            task.reject(msg.data);
            break;
          default:
            console.warn("unhandle message:", msg);
            break;
        }
      }
    };
    download_worker;
    download_worker.addEventListener("message", onmessage);
    cg = () => download_worker.removeEventListener("message", onmessage);
    // 不论如何都将监听函数移除掉
    task.promise.then(cg, cg);
    const res = {
      worker: download_worker,
      req_id,
      task,
    };
    this._sync_lock = res;
    return res;
  }
  async downloadBlockInWorker(startHeight: number, endHeight: number, max_end_height: number) {
    const blockService = await this.constructor_inited.promise;
    // 缺少最新区块，下载补全
    const download_worker = this.getDownloadWorker();
    const req_id = this._download_req_id_acc++;
    let cg;
    download_worker.postMessage({
      NET_VERSION: blockService.baseConfig.NET_VERSION,
      cmd: "download",
      webio_path: blockService.fetch.webio.io_url_path,
      magic: blockService.baseConfig.MAGIC,
      startHeight,
      endHeight,
      max_end_height,
      req_id,
    });
    const task_name = `补全区块数据${startHeight} ~ ${endHeight}`;
    const task = new PromiseOut<void>();
    const onmessage = e => {
      const msg = e.data;
      if (msg && msg.req_id === req_id) {
        // console.log("bs", msg);
        switch (msg.type) {
          case "start-download":
            console.log("开始", task_name);
            break;
          case "end-download":
            console.log("完成", task_name);
            task.resolve();
            break;
          case "use-flow":
            blockService.appSetting.share_settings.sync_data_flow += (+msg.data.up || 0) + (+msg.data.down || 0);
            break;
          case "progress":
            // console.log("下载中", task_name, msg.data);
            blockService.tryEmit("BLOCKCHAIN:CHANGED");
            break;
          case "error":
            task.reject(msg.data);
            break;
          default:
            console.warn("unhandle message:", msg);
            break;
        }
      }
    };
    download_worker.addEventListener("message", onmessage);
    cg = () => download_worker.removeEventListener("message", onmessage);
    // 不论如何都将监听函数移除掉
    task.promise.then(cg, cg);
    return {
      worker: download_worker,
      req_id,
      task,
    };
  }
  /**更新最新的区块，并尝试下载破损的区块链数据*/
  async updateLastBlockAndTryDownloadDestoryBlocks(lastBlock: BlockModel) {
    const blockService = await this.constructor_inited.promise;
    const block = formatBlockData(lastBlock);

    // 获取目前高度最高的区块
    const cur_lastBlock = await blockService.getLocalLastBlock();
    if (cur_lastBlock) {
      if (cur_lastBlock.height >= lastBlock.height) {
        // TOOD：拜占庭询问区块是否正确，然后进行更新或者拉黑名单的操作
        console.error("区块数移除，存在比当前最新区块更高的区块");
        return;
      }
    }

    await (await blockService.getBlockDB()).upsert(block).catch(err => console.warn(`[${lastBlock.height}]`, err.message));
    // 新的输入插入后，就要通知更新区块链
    blockService.tryEmit("BLOCKCHAIN:CHANGED");
    if (cur_lastBlock) {
      if (lastBlock.height - cur_lastBlock.height > 1) {
        const startHeight = cur_lastBlock.height + 1;
        const endHeight = lastBlock.height - 1;
        // 缺少最新区块，下载补全
        const { task } = await this.downloadBlockInWorker(startHeight, endHeight, lastBlock.height);
        await task.promise;
      }
    }
  }
}
