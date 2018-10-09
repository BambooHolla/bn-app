import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams, Refresher } from "ionic-angular/index";
import { PAGE_STATUS } from "../../../bnqkl-framework/const";
import {
  MinServiceProvider,
  DelegateModel,
  RankModel,
} from "../../../providers/min-service/min-service";
import SocketIO from "socket.io-client";

enum InOutSubPage {
  IN_VOTE = "in-vote",
  OUT_VOTE = "out-vote",
}

@IonicPage({ name: "vote-list" })
@Component({
  selector: "page-vote-list",
  templateUrl: "vote-list.html",
})
export class VoteListPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public minService: MinServiceProvider
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  InOutSubPage = InOutSubPage;
  current_page = InOutSubPage.OUT_VOTE;
  gotoSubPage(page: InOutSubPage) {
    if (page in InOutSubPage) {
      console.warn(`${page} no via page`);
      return;
    }
    this.current_page = page;
    if (this.current_page === InOutSubPage.OUT_VOTE) {
      // TODO： need_refresh 参数已经应该直接删除，使用数据库进行缓存接口
      this.out_vote_list_config.need_refresh && this.initOutVoteList();
      this.can_vote_list_config.need_refresh && this.initCanVoteList();
    }
  }
  /**投出去的票*/
  out_vote_list: DelegateModel[] = [];
  out_vote_list_config = {
    skip: 0,
    pageSize: 20,
    has_more: true,
    need_refresh: true,
    loading: new Set(),
  };
  can_vote_list: DelegateModel[] = [];
  can_vote_list_config = {
    skip: 0,
    pageSize: 20,
    has_more: true,
    need_refresh: true,
    loading: new Set(),
  };

  mac_socketio_list: SocketIOClient.Socket[] = [];
  my_mining_machine: any[] = [];
  @VoteListPage.willEnter
  async loadDataWhenEnter() {
    const page = this.navParams.get("page");
    if (page) {
      this.gotoSubPage(page);
    }
    this.my_mining_machine = this.appSetting.settings.my_mining_machine.map(
      mac => {
        const res = {
          ...mac,
          cpu_usage: 0,
          connected: false,
        };

        // 远程监听设备的CPU
        const socket = listenMacStatus(mac, usage => {
          res.cpu_usage = usage;
        });
        socket.on("connect", () => {
          res.connected = true;
        });
        socket.on("disconnect", () => {
          res.connected = false;
        });
        return res;
      }
    );
  }
  @VoteListPage.didLeave
  destorySockets() {
    this.mac_socketio_list.forEach(socket => {
      socket.close();
    });
    this.mac_socketio_list = [];
  }

  @VoteListPage.addEvent("HEIGHT:CHANGED")
  watchHeightChanged(height, is_init) {
    this.out_vote_list_config.need_refresh = true;
    this.can_vote_list_config.need_refresh = true;
    if (this.current_page === InOutSubPage.OUT_VOTE) {
      this.initOutVoteList();
      this.initCanVoteList();
    }
  }

  //// 已经投的
  // @asyncCtrlGenerator.loading(() =>
  //   VoteListPage.getTranslate("LOADING_OUT_VOTE_LIST"),
  // )
  initOutVoteList() {
    return this.loadOutVoteList();
  }
  @asyncCtrlGenerator.error(() =>
    VoteListPage.getTranslate("LOAD_OUT_VOTE_LIST_ERROR")
  )
  async loadOutVoteList(refresher?: Refresher) {
    const { out_vote_list_config } = this;
    out_vote_list_config.need_refresh = false;
    out_vote_list_config.skip = 0;
    this.out_vote_list = await this._loadOutVoteList();
    if (refresher) {
      refresher.complete();
    }
  }
  @asyncCtrlGenerator.error(() =>
    VoteListPage.getTranslate("LOAD_MORE_OUT_VOTE_LIST_ERROR")
  )
  async loadMoreOutVoteList() {
    this.out_vote_list.push(...(await this._loadOutVoteList()));
  }

  private async _loadOutVoteList() {
    const { out_vote_list_config } = this;
    const load_id = { t: performance.now() };
    try {
      out_vote_list_config.loading.add(load_id);

      const { delegates, skip, done } = await this.minService.getVotedDelegates(
        out_vote_list_config.skip,
        out_vote_list_config.pageSize
      );
      out_vote_list_config.skip = skip;
      out_vote_list_config.has_more = !done;
      return delegates;
    } finally {
      out_vote_list_config.loading.delete(load_id);
    }
  }

  ///// 可投的
  // @asyncCtrlGenerator.loading(() =>
  //   VoteListPage.getTranslate("LOADING_CAN_VOTE_LIST"),
  // )
  async initCanVoteList() {
    return this.loadCanVoteList();
  }
  @asyncCtrlGenerator.error(() =>
    VoteListPage.getTranslate("LOAD_CAN_VOTE_LIST_ERROR")
  )
  async loadCanVoteList(refresher?: Refresher) {
    const { can_vote_list_config } = this;
    can_vote_list_config.need_refresh = false;
    // 重置分页
    can_vote_list_config.skip = 0;

    this.can_vote_list = await this._getCanVoteList();
    if (refresher) {
      refresher.complete();
    }
  }
  @asyncCtrlGenerator.error(() =>
    VoteListPage.getTranslate("LOAD_MORE_CAN_VOTE_LIST_ERROR")
  )
  async loadMoreCanVoteList() {
    this.can_vote_list.push(...(await this._getCanVoteList()));
  }
  private async _getCanVoteList() {
    const { can_vote_list_config } = this;

    const load_id = { t: performance.now() };
    try {
      can_vote_list_config.loading.add(load_id);
      const {
        skip,
        done,
        delegates,
      } = await this.minService.getVoteAbleDelegates(
        can_vote_list_config.skip,
        can_vote_list_config.pageSize
      );

      can_vote_list_config.skip = skip;
      can_vote_list_config.has_more = !done;
      return delegates;
    } finally {
      can_vote_list_config.loading.delete(load_id);
    }
  }
}
import { cpusStatus, MiningMachine, systemStatus } from "../types";
function cpuAverage(cpus: cpusStatus) {
  //Initialise sum of idle and time of cores and fetch CPU info
  var totalIdle = 0,
    totalTick = 0;

  //Loop through CPU cores
  for (var i = 0, len = cpus.length; i < len; i++) {
    //Select CPU core
    let cpu = cpus[i];

    //Total up the time in the cores tick
    for (var type in cpu.times) {
      totalTick += cpu.times[type];
    }

    //Total up the idle time of the core
    totalIdle += cpu.times.idle;
  }

  //Return the average Idle and Tick times
  return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
}

export function listenMacStatus(
  mac: MiningMachine,
  cpu_cb?: (cpu_usage: number) => void,
  memory_cb?: (memory_usage: number, total: number, freeMem: number) => void
) {
  const socket = SocketIO(`http://${mac.ip}:${mac.port}/systemInfo`, {
    transports: ["websocket"],
    reconnection: false,
  });
  let startMeasure;
  socket.on(
    "systemStatus",
    ({ systemStatus: data }: { systemStatus: systemStatus }) => {
      if (cpu_cb) {
        if (!startMeasure) {
          startMeasure = cpuAverage(data.cpusStatus);
        } else {
          const endMeasure = cpuAverage(data.cpusStatus);
          //Calculate the difference in idle and total time between the measures
          const idleDifference = endMeasure.idle - startMeasure.idle;
          const totalDifference = endMeasure.total - startMeasure.total;

          //Calculate the average percentage CPU usage
          const usage = 1 - idleDifference / totalDifference;
          cpu_cb(usage);
          startMeasure = endMeasure;
        }
      }
      if (memory_cb) {
        memory_cb(
          1 - data.memStatus.freeMem / data.memStatus.totalmem,
          data.memStatus.totalmem,
          data.memStatus.freeMem
        );
      }
    }
  );
  socket.emit("systemStatus", {});
  return socket;
}
