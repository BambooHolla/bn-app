import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { PromiseOut } from "../../../bnqkl-framework/PromiseExtends";
import { AppFetchProvider } from "../../../providers/app-fetch/app-fetch";
import {
  MinServiceProvider,
  DelegateModel,
} from "../../../providers/min-service/min-service";
import { PeerServiceProvider } from "../../../providers/peer-service/peer-service";
import { TransactionServiceProvider } from "../../../providers/transaction-service/transaction-service";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { MiningMachine } from "../types";
import { listenMacStatus } from "../vote-list/vote-list";

@IonicPage({ name: "vote-mining-machine-detail" })
@Component({
  selector: "page-vote-mining-machine-detail",
  templateUrl: "vote-mining-machine-detail.html",
})
export class VoteMiningMachineDetailPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public minService: MinServiceProvider,
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  mac!: MiningMachine & {
    memory_usage: number;
    total_memory: number;
    used_memory: number;
    cpu_usage: number;
    connected: boolean;
    loading_is_enabled?: boolean;
    is_enabled: boolean;
  };
  deleteMac() {
    this.showConfirmDialog(
      this.getTranslateSync("CONFIRM_TO_DELETE_THIS_MACHINE"),
      () => {
        const { mac } = this;
        this.appSetting.settings.my_mining_machine = this.appSetting.settings.my_mining_machine.filter(
          my_mac => !(my_mac.ip === mac.ip && my_mac.port === mac.port),
        );
        this.finishJob(true);
      },
    );
  }
  @VoteMiningMachineDetailPage.willEnter
  initData() {
    const mining_machine = this.navParams.get("mac") as MiningMachine;
    if (!mining_machine) {
      return this.navCtrl.goToRoot({});
    }
    this.mac = {
      ...mining_machine,
      memory_usage: 0,
      total_memory: 0,
      used_memory: 0,
      cpu_usage: 0,
      connected: false,
      is_enabled: false,
    }; // 复制一份
    const socket = listenMacStatus(
      this.mac,
      cpu_usage => {
        this.mac.cpu_usage = cpu_usage;
      },
      (memory_usage, total, free) => {
        this.mac.memory_usage = memory_usage;
        this.mac.total_memory = total;
        this.mac.used_memory = total - free;
      },
    );
    socket.on("connect", () => {
      this.mac.connected = true;
    });
    socket.on("disconnect", () => {
      this.mac.connected = false;
    });

    // 初始化矿机状态
    this.loadIsForgeEnabled();
  }
  /**加载矿机挖矿状态*/
  @asyncCtrlGenerator.error("@@LOAD_FORGE_STATUS_FAIL")
  async loadIsForgeEnabled() {
    const { mac, minService } = this;
    mac.loading_is_enabled = true;
    try {
      mac.is_enabled = await minService
        .oneTimeUrl(minService.FORGE_STATUS, `http://${mac.ip}:${mac.webPort}`)
        .getForgeStaus(mac.publicKey);
      // .catch(() => (mac.is_enabled = false))
    } finally {
      mac.loading_is_enabled = false;
    }
  }
  delegate_info?: DelegateModel;
  current_info_height = -1;
  @VoteMiningMachineDetailPage.addEventAfterDidEnter("HEIGHT:CHANGED")
  async watchHeightChanged() {
    const cur_block_height = this.appSetting.getHeight();
    if (this.current_info_height !== cur_block_height) {
      this.delegate_info = await this.minService.getDelegateInfo(
        this.mac.publicKey,
      );
      this.current_info_height = cur_block_height;
    }
  }

  @asyncCtrlGenerator.error()
  @asyncCtrlGenerator.loading()
  async stopMining() {
    const { mac, minService } = this;
    const res = await minService
      .oneTimeUrl(minService.FORGE_ENABLE, `http://${mac.ip}:${mac.webPort}`)
      .disableForge(mac.delegate_pwd, mac.publicKey);
    await this.loadIsForgeEnabled();
  }
  @asyncCtrlGenerator.error()
  @asyncCtrlGenerator.loading()
  async startMining() {
    const { mac, minService } = this;
    const res = await minService
      .oneTimeUrl(minService.FORGE_ENABLE, `http://${mac.ip}:${mac.webPort}`)
      .enableForge(mac.delegate_pwd, mac.publicKey);
    await this.loadIsForgeEnabled();
  }
  async turnPowerOff() {}
}
