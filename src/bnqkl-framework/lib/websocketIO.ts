
import socketio from "socket.io-client";
import EventEmitter from "eventemitter3";
class WSIOInstance extends EventEmitter {
  constructor(public server_url: string, public nsp = "/web") {
    super();
  }
  get io_url_path() {
    return this.server_url + this.nsp;
  }
  private _onLine = navigator.onLine;
  get onLine() {
    return this._onLine;
  }
  private _reconnecting = false;
  getOnlineStatus() {
    if (this.onLine) {
      return true;
    }
    if (this._reconnecting) {
      return new Promise<boolean>((resolve, reject) => {
        this.once("ononline", () => resolve(true));
        this.once("onoffline", () => resolve(false));
      });
    }
    return false;
  }
  private _io?: SocketIOClient.Socket;
  get io() {
    if (!this._io) {
      const io = socketio(this.io_url_path, {
        transports: ["websocket"],
      });
      this._io = io;
      this._io.on("connect", () => {
        this._reconnecting = false;
        this._onLine = true;
        this.emit("ononline");
      });
      this._io.on("disconnect", () => {
        this._reconnecting = false;
        this._onLine = false;
        this.emit("onoffline");
      });
      this._io.on("connect_error", () => {
        this._reconnecting = false;
        this._onLine = false;
        this.emit("onoffline");
      });
      this._io.on("reconnecting", () => {
        this._reconnecting = true;
      });
      // 尝试自动重连，可能一开始服务就不可用，后面才可用的，所以reconnect没法正常工作
      setInterval(() => {
        if (io.connected === false) {
          io.connect();
        }
      }, 1e4);
    }
    return this._io;
  }
}
const WSIOInstanceMap = new Map<string, WSIOInstance>();

export function getSocketIOInstance(server_url: string, nsp: string) {
  const key = server_url + nsp;
  let ins = WSIOInstanceMap.get(key);
  if (!ins) {
    ins = new WSIOInstance(server_url, nsp);
    WSIOInstanceMap.set(key, ins);
  }
  return ins;
}
