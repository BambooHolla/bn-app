import { baseConfig, tryRegisterGlobal } from "../../bnqkl-framework/helper";
import { BlockServiceProvider, BlockModel } from "./block-service";
import { TransactionModel } from "../transaction-service/transaction.types";
import { getUTF8ByteSize, getJsonObjectByteSize } from "../../pages/_settings/settings-cache-manage/calcHelper";
import { Modal } from "ionic-angular/index";
import { LocalPeerModel } from "../peer-service/peer.types";
import { PromiseOut } from "../../bnqkl-framework/lib/PromiseOut";

import socketIoFactory from "socket.io-client";
tryRegisterGlobal("socketio", socketIoFactory);

import debug from "debug";
const log = debug("IBT:block-io");

export class P2PIO {
  constructor(public constructor_inited: PromiseOut<BlockServiceProvider>) {
    const descriptor = Object.getOwnPropertyDescriptor(this, "io");
    if (descriptor) {
      baseConfig.WatchPropChanged("SERVER_URL")(this, 'io', descriptor);
      Object.defineProperty(this, "io", descriptor);
    }
    this.io;
  }
  private _io?: SocketIOClient.Socket;
  get io() {
    if (this._io) {
      this._io.disconnect();
    }
    log("初始化 SocketIOClient 对象", baseConfig.SERVER_URL);
    const io = this._io = socketIoFactory(baseConfig.SERVER_URL, {
      transports: ["websocket"],
    });

    this.constructor_inited.promise.then((blockService) => {
      if (io == this._io) {
        P2PIO.bindIOBlockChange(io, blockService);
      }
    });
    return this._io;
  }
  static ENCODE_SYMBOL = Symbol.for("encode");
  static bindIOBlockChange(io: SocketIOClient.Socket, blockService: BlockServiceProvider) {
    const io_origin = baseConfig.SERVER_URL;
    const encoder = io.io["encoder"];
    const { ENCODE_SYMBOL } = P2PIO;
    if (!encoder[ENCODE_SYMBOL]) {
      encoder[ENCODE_SYMBOL] = encoder.encode;

      // 不改原型链，只针对当前的这个链接对象进行修改
      encoder.encode = function (obj, callback) {
        this[ENCODE_SYMBOL](obj, (buffer_list, ...args) => {
          if (buffer_list instanceof Array) {
            let acc_flow = 0;
            buffer_list.forEach(data_item => {
              if (typeof data_item == "string") {
                acc_flow += getUTF8ByteSize(data_item);
              } else if (data_item instanceof ArrayBuffer) {
                acc_flow += data_item.byteLength;
              }
            });
            if (acc_flow) {
              blockService.peerService.updatePeerFlow(io_origin, acc_flow, 0);
            }
          }
          callback(buffer_list, ...args);
        });
      };
      io.io["engine"].on("data", data_item => {
        let acc_flow = 0;
        if (typeof data_item == "string") {
          acc_flow += getUTF8ByteSize(data_item);
        } else if (data_item instanceof ArrayBuffer) {
          acc_flow += data_item.byteLength;
        }
        if (acc_flow) {
          blockService.peerService.updatePeerFlow(io_origin, 0, acc_flow);
        }
      });
    }
    //#region 处理新区快
    let _reselect_peer_model: Promise<Modal> | undefined;
    io.on("blocks/change", async data => {
      // 计算流量大小
      const flow = getJsonObjectByteSize(data) /*返回的JSON对象大小*/ + 19 /*基础消耗*/;
      blockService.appSetting.share_settings.sync_data_flow += flow; // 同步的流量
      blockService.appSetting.settings.contribution_flow += flow; // 同时也属于贡献的流量
      /*更新数据库中的流量使用信息*/
      blockService.peerService.updatePeerFlow(io_origin, 0, flow);

      const lastBlock: BlockModel = data.lastBlock;

      log("区块更新 %s %o", new Date().toLocaleString(), lastBlock);

      const current_height = blockService.appSetting.getHeight();
      if (lastBlock.height < current_height && !_reselect_peer_model) {
        const reselect_peer_model = blockService.showConfirmDialog("所连的节点似乎脱离共识，是否选择自动连接新的节点？", async () => {
          const dialog = await blockService.showLogoLoading("快速查询可用节点中");
          const useablePeers = await blockService.peerService.getPeersLocal({ magic: blockService.baseConfig.MAGIC });
          const prepare_num = 10; // Math.max(57,Math.floor(useablePeers.length/2)+1); // 最多准备10个节点来选择
          const prepare_peer_list: LocalPeerModel[] = [];
          for await (var _peer of blockService.peerService.fastMatchUseablePeer(useablePeers)) {
            const peer = _peer;
            if (peer.height > current_height) {
              prepare_peer_list.push(peer);
              if (prepare_peer_list.length > prepare_num) {
                break;
              }
            }
          }
          prepare_peer_list.sort((a, b) => {
            const h_dif = b.height - a.height;
            if (h_dif === 0) {
              return a.delay - b.delay;
            }
            return h_dif;
          });
          await blockService.peerService.linkPeer(prepare_peer_list[0]);
          blockService.updateHeight();
          dialog.dismiss();
        });
        _reselect_peer_model = reselect_peer_model;
        (await reselect_peer_model).onDidDismiss(() => {
          _reselect_peer_model = undefined;
        });
      }
      blockService.updateHeight(lastBlock);

      // 更新预期交易区块
      blockService.expectblock_uncommited = 0;
      blockService.expectblock_fee_reward = 0;
      blockService.getExpectBlockInfo().then(expect_block => {
        blockService.tryEmit("EXPECTBLOCK:CHANGED", expect_block);
      });
    });
    //#endregion

    //#region 处理未确认交易
    io.on("transactions/unconfirm", data => {
      const tran: TransactionModel = data.transaction;
      log("收到未确认交易 %s %o", new Date().toLocaleString(), tran);
      blockService.appSetting.settings.detal_tran_num += 1;
      blockService.expectblock_uncommited += 1;
      blockService.expectblock_fee_reward += parseFloat(tran.fee);
      blockService.getExpectBlockInfo().then(expect_block => {
        blockService.tryEmit("EXPECTBLOCK:CHANGED", expect_block);
      });
    });
    //#endregion
  }
}
