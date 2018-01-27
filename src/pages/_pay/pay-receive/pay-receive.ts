import { Component, Optional, ViewChild } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import {
  IonicPage,
  NavController,
  NavParams,
  Refresher,
  Content,
} from "ionic-angular";
import {
  TransferProvider,
  ReceiveLogModel,
} from "../../../providers/transfer/transfer";

@IonicPage({ name: "pay-receive" })
@Component({
  selector: "page-pay-receive",
  templateUrl: "pay-receive.html",
})
export class PayReceivePage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public transferProvider: TransferProvider,
    @Optional() public tabs: TabsPage,
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  account_info = {
    username: "吴祖贤",
    address: "b7LA11Tgg3HNiAD6rJMDpD44y3V4WGNX8R",
  };
  receive_logs: ReceiveLogModel[];
  receive_config = {
    has_more: true,
    num: 20,
    from: new Date(),
  };

  @PayReceivePage.willEnter
  async loadReceiveLogs(refresher?: Refresher) {
    const receive_logs = await this.transferProvider.getReceiveLogList(
      this.receive_config.num,
      this.receive_config.from,
    );
    const last_log = receive_logs[receive_logs.length - 1];
    if (last_log) {
      this.receive_config.from = last_log.create_time;
    }
    this.receive_config.has_more =
      receive_logs.length == this.receive_config.num;

    this.receive_logs = receive_logs;
    if (refresher) {
      refresher.complete();
    }
  }

  async loadMoreReceiveLogs() {
    await new Promise(cb => setTimeout(cb, Math.random() * 3000));
    const receive_logs = await this.transferProvider.getReceiveLogList(
      this.receive_config.num,
      this.receive_config.from,
    );
    this.receive_logs.push(...receive_logs);
  }

  // 滚动添加阴影
  @ViewChild("logsContent") logsContent: Content;
  logs_content_shadow_config = {
    distance: 300, // 显示完整阴影所需的位移量
    from_color: [29, 98, 113, 0],
    to_color: [29, 98, 113, 0.3],
    pre_scroll_process: 0,
    is_inited: false,
  };
  @PayReceivePage.didEnter
  _autoAddLogsContentShadowWhenScrollDown() {
    if (this.logs_content_shadow_config.is_inited) {
      return;
    }
    this.logs_content_shadow_config.is_inited = true;
    this.logsContent.ionScroll.subscribe(() => {
      const {
        from_color,
        to_color,
        distance,
        pre_scroll_process,
      } = this.logs_content_shadow_config;
      const process = Math.min(this.logsContent.scrollTop / distance, 1);
      if (process === pre_scroll_process) {
        return;
      }
      this.logs_content_shadow_config.pre_scroll_process = process;

      let cur_color;
      if (process === 0) {
        cur_color = from_color;
      } else if (process === 1) {
        cur_color = to_color;
      } else {
        cur_color = from_color.map((from_v, i) => {
          const to_v = to_color[i];
          return (to_v - from_v) * process + from_v;
        });
      }
      this.logsContent.setElementStyle(
        "box-shadow",
        `inset 0 0.4rem 1rem -0.1rem rgba(${cur_color})`,
      );
    });
  }
}
