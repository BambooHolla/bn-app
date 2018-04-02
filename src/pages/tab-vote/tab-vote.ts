import { Component, ViewChild, ElementRef } from "@angular/core";
import { Subscription } from "rxjs/Subscription";
import { SafeStyle, DomSanitizer } from "@angular/platform-browser";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { SatellitePixiComponent } from "../../components/satellite-pixi/satellite-pixi";
import { FallCoinsComponent } from "../../components/fall-coins/fall-coins";
import { ChainMeshComponent } from "../../components/chain-mesh/chain-mesh";
import { BuddhaGlowComponent } from "../../components/buddha-glow/buddha-glow";
import { MiningPersonComponent } from "../../components/mining-person/mining-person";
import { AniBase, Easing } from "../../components/AniBase";
import { TabsPage } from "../tabs/tabs";
import {
  MinServiceProvider,
  RankModel,
  RateOfReturnModel,
} from "../../providers/min-service/min-service";
import { AccountServiceProvider } from "../../providers/account-service/account-service";
import { BlockServiceProvider } from "../../providers/block-service/block-service";
import { HEIGHT_AB_Generator } from "../../providers/app-setting/app-setting";
import {
  BenefitServiceProvider,
  BenefitModel,
} from "../../providers/benefit-service/benefit-service";
import { CoverTabsCtrlModelPage } from "../cover-tabs-ctrl-model/cover-tabs-ctrl-model";

export enum VotePage {
  None = "",
  Bootstrap = "bootstrap",
  VoteDetail = "vote-detail",
  ExtendsPanel = "extends-panel",
}
export enum ExtendsPanel {
  incomeRanking = "income-ranking",
  currentBlockIncome = "current-block-income",
  incomeTrend = "income-trend",
  myContribution = "my-contribution",
  preRoundIncomeRate = "pre-round-income-rate",
}

// @IonicPage({ name: "tab-vote" })
@Component({
  selector: "page-tab-vote",
  templateUrl: "tab-vote.html",
})
export class TabVotePage extends FirstLevelPage {
  VotePage = VotePage;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public sanitizer: DomSanitizer,
    public tabs: TabsPage,
    public minService: MinServiceProvider,
    public accountService: AccountServiceProvider,
    public benefitService: BenefitServiceProvider,
    public blockService: BlockServiceProvider,
  ) {
    super(navCtrl, navParams);
  }

  @TabVotePage.didEnter
  hiddenTabBg() {
    if (this.page_status === VotePage.None) {
      this.page_status = VotePage.Bootstrap;
    }
    if (this.page_status === VotePage.Bootstrap) {
      // 如果已经开启自动挖矿，直接进入挖矿动画页面
      if (this.appSetting.settings.background_mining) {
        // 使用startMin而不是routeToVoteDetail，为了确保自动挖矿的检查条件一定要执行
        this.startMin();
      }
    }
    this.tabs.setBgTransparent(
      this.page_status === VotePage.Bootstrap,
      this.cname,
    );
  }
  @TabVotePage.didLeave
  recoverTabBg() {
    this.tabs.setBgTransparent(false, this.cname);
  }

  @ViewChild("aniWrapper") aniWrapper?: ElementRef;
  @TabVotePage.onInit
  initAniContainerSize() {
    // 初始化容器大小
    if (this.aniWrapper) {
      const targetEle = this.aniWrapper.nativeElement;
      targetEle.style.transform = `scale(${document.body.clientWidth *
        0.8 /
        targetEle.clientWidth})`;
    }
  }
  private _set_fall_coin_progress() {
    if (this.fall_coin) {
      if (this.fall_coin.is_inited) {
        this.fall_coin.progress = (this.appSetting.getHeight() / 57) % 1;
      } else {
        this.fall_coin.once("init-start", () => {
          this.platform.raf(this._set_fall_coin_progress.bind(this));
        });
      }
    }
  }
  private _waiting_ani?: any;
  private _set_satellite_pixi_progress_process_id = 0; // 进度id，这个设置动画的过程是多个异步在结合，所以确保这个函数上下文是一致的，必须要有一个id来让这些异步知道自己能继续往下做
  /**设置卫星动画进度*/
  private _set_satellite_pixi_progress(immediate?: boolean) {
    const id = ++this._set_satellite_pixi_progress_process_id;
    const can_run = () => id === this._set_satellite_pixi_progress_process_id;
    clearInterval(this._waiting_ani);
    if (can_run() && this.satellite_pixi) {
      if (this.satellite_pixi.is_inited) {
        this.satellite_pixi.progress = 0;
        this.blockService.getLastBlockRefreshInterval().then(diff_time => {
          const BLOCK_UNIT_TIME = this.appSetting.BLOCK_UNIT_TIME;
          diff_time %= BLOCK_UNIT_TIME;
          // if (diff_time < BLOCK_UNIT_TIME) {
          if (can_run() && this.satellite_pixi) {
            if (immediate) {
              // 立即更新现在的进度
              this.satellite_pixi.setProgress(diff_time / BLOCK_UNIT_TIME, 0);
            }
            this.satellite_pixi.setProgress(1, BLOCK_UNIT_TIME - diff_time);
          }
          // } else {
          //   // 延迟了，等
          //   const ani_dur = 1000;
          //   const doWaitingAni = () => {
          //     if (this.satellite_pixi) {
          //       this.satellite_pixi.setProgress(
          //         this.satellite_pixi.progress + 1,
          //         ani_dur,
          //         Easing.Quartic_InOut,
          //       );
          //     } else {
          //       clearInterval(this._waiting_ani);
          //     }
          //   };
          //   doWaitingAni();
          //   this._waiting_ani = setInterval(doWaitingAni, ani_dur);
          // }
        });
      } else {
        this.satellite_pixi.once("init-start", () => {
          this.platform.raf(this._set_satellite_pixi_progress.bind(this));
        });
      }
    }
  }

  private _startVoteAnimate() {
    if (this.fall_coin) {
      if (this.fall_coin.is_inited) {
        this.fall_coin.startAnimation();
      }
    }
    this._set_fall_coin_progress();
    if (this.satellite_pixi) {
      if (this.satellite_pixi.is_inited) {
        this.satellite_pixi.startAnimation();
      }
    }
    this._set_satellite_pixi_progress(true);
    this.mining_person &&
      this.mining_person.is_inited &&
      this.mining_person.startAnimation();
    this.buddha_glow &&
      this.buddha_glow.is_inited &&
      this.buddha_glow.startAnimation();
    if (!this.is_show._inited) {
      this.is_show._inited = true;
      setTimeout(() => {
        // 先显示阳光
        this.is_show.buddha_glow = true;
        setTimeout(() => {
          // 再显示卫星与挖矿的人
          this.is_show.satellite_pixi = true;
          this.is_show.mining_person = true;
          setTimeout(() => {
            // 最后显示金币
            this.is_show.fall_coins = true;
          }, 250);
        }, 250);
      }, 100);
    }

    this.chain_mesh && this.chain_mesh.startAnimation();
  }
  page_status = VotePage.None;
  routeToVoteDetail() {
    this.tabs.setBgTransparent(false, this.cname);
    this.page_status = VotePage.VoteDetail;
    // page_status更新后，触发数据获取函数
    this.dispatchEvent("page on:vote-detail");
    this._startVoteAnimate();

    const { _earth_enabled_config, earth_config } = this;
    for (const key in _earth_enabled_config) {
      const from = earth_config[key];
      const to = _earth_enabled_config[key];
      if (from == to) {
        continue;
      }

      if (key.indexOf("_color") != -1) {
        AniBase.animateColor(from, to, 500)(v => {
          earth_config[key] = (v[0] << 16) + (v[1] << 8) + v[2];
          return this.page_status == "vote-detail";
        });
      } else {
        AniBase.animateNumber(from, to, 500)(v => {
          earth_config[key] = v;
          return this.page_status == "vote-detail";
        });
      }
    }
  }
  private _stopVoteAnimate(
    opts: {
      is_force_stop_chain_mesh?: boolean;
      is_keep_mining_person_sound?: boolean;
    } = {},
  ) {
    this.fall_coin &&
      this.fall_coin.is_inited &&
      this.fall_coin.stopAnimation();
    this.satellite_pixi &&
      this.satellite_pixi.is_inited &&
      this.satellite_pixi.stopAnimation();
    this.mining_person &&
      this.mining_person.is_inited &&
      this.mining_person.stopAnimation(opts.is_keep_mining_person_sound);
    this.buddha_glow &&
      this.buddha_glow.is_inited &&
      this.buddha_glow.stopAnimation();
    if (opts.is_force_stop_chain_mesh) {
      this.chain_mesh && this.chain_mesh.stopAnimation();
    } else {
      const { _earth_disabled_config, earth_config } = this;
      for (const key in _earth_disabled_config) {
        const from = earth_config[key];
        const to = _earth_disabled_config[key];
        const finish_fun = () => {
          this.chain_mesh && this.chain_mesh.stopAnimation();
        };
        if (key.indexOf("_color") != -1) {
          AniBase.animateColor(from, to, 500)(v => {
            earth_config[key] = (v[0] << 16) + (v[1] << 8) + v[2];
            return this.page_status == "bootstrap";
          }, finish_fun);
        } else {
          AniBase.animateNumber(from, to, 500)(v => {
            earth_config[key] = v;
            return this.page_status == "bootstrap";
          }, finish_fun);
        }
      }
    }
  }
  routeToBootstrap() {
    this.tabs.setBgTransparent(true, this.cname);
    this.page_status = VotePage.Bootstrap;
    this._stopVoteAnimate();
  }
  @ViewChild(FallCoinsComponent) fall_coin?: FallCoinsComponent;
  @ViewChild(SatellitePixiComponent) satellite_pixi?: SatellitePixiComponent;
  @ViewChild(BuddhaGlowComponent) buddha_glow?: BuddhaGlowComponent;
  @ViewChild(ChainMeshComponent) chain_mesh?: ChainMeshComponent;
  @ViewChild(MiningPersonComponent) mining_person?: MiningPersonComponent;

  _earth_disabled_config = {
    body_color: 0xececec,
    // body_color: 0x333333,
    body_opacity: 0.8,
    line_color: 0x666666,
    line_opacity: 0.6,
  };
  _earth_enabled_config = {
    body_color: 0xfbc62b,
    body_opacity: 1,
    line_color: 0xffd246,
    line_opacity: 1,
  };
  earth_config = { ...this._earth_disabled_config };
  @TabVotePage.didEnter
  initEarchNetMesh() {
    // 执行一帧，并停止
    if (this.chain_mesh) {
      const _loop = () => {
        requestAnimationFrame(() => {
          this.chain_mesh &&
            this.chain_mesh.app &&
            this.chain_mesh.app.ticker.update();
        });
      };
      if (this.chain_mesh.is_app_ready) {
        _loop();
      } else {
        this.chain_mesh.once("app-ready", _loop);
      }
    }
  }

  is_show = {
    _inited: false,
    satellite_pixi: false,
    buddha_glow: false,
    fall_coins: false,
    show_big_fall_icon: false,
    round_ani: false,
    mining_person: false,
  };

  try_min_starting = false;
  min_starting = false;
  /** 开启挖矿*/
  @asyncCtrlGenerator.error(() =>
    TabVotePage.getTranslate("START_AUTO_VOTE_ERROR"),
  )
  async startMin() {
    this.min_starting = true;
    try {
      if (parseFloat(this.appSetting.settings.default_fee) == 0) {
        this.alertCtrl
          .create({
            title: this.translate.instant("DEFAULT_FEE_NOT_SETTED"),
            message: this.translate.instant(
              "DO_YOU_WANT_TO_SET_YOUER_DEFAULT_FEE",
            ),
            buttons: [
              this.translate.instant("NO"),
              {
                text: this.translate.instant("YES"),
                handler: () => {
                  this.routeTo("settings-set-default-fee", {
                    auto_return: true,
                    after_finish_job: () => {
                      this.startMin();
                    },
                  });
                },
              },
            ],
          })
          .present();
        return;
      }

      const pwdData = await this.getUserPassword({
        title: "@@START_VOTE_VERIFY",
      });
      await this.minService.tryVote(undefined, pwdData).catch(err => {
        if (err === "you have already voted") {
          // 启动倒计时界面
          console.log(
            "%c已经投票，倒计时等待结果",
            "font-size:3em;color:green;",
          );
          return err;
        } else {
          return Promise.reject(err);
        }
      });
      this.routeToVoteDetail();
    } finally {
      this.min_starting = false;
    }
  }
  /** 关闭挖矿*/
  @asyncCtrlGenerator.error(() =>
    TabVotePage.getTranslate("STOP_AUTO_VOTE_ERROR"),
  )
  async stopMin() {
    this.minService.stopVote();
    this.routeToBootstrap();
  }

  /**动画的进度监控*/
  @TabVotePage.addEvent("HEIGHT:CHANGED")
  watchHeightChanged(height, is_init) {
    if (this.page_status === VotePage.VoteDetail) {
      this._set_fall_coin_progress();
      this._set_satellite_pixi_progress(is_init);
    }
  }

  private get _pre_ani_round() {
    return (
      parseFloat(localStorage.getItem("@tab-vote-pre_ani_round") || "") || 0
    );
  }
  private set _pre_ani_round(v: number) {
    localStorage.setItem("@tab-vote-pre_ani_round", v.toString());
  }

  ExtendsPanel = ExtendsPanel;
  openExtendsPanel(panel: ExtendsPanel) {
    if (this.page_status == VotePage.ExtendsPanel) {
      return;
    }
    this.page_status = VotePage.ExtendsPanel;
    this._stopVoteAnimate({
      is_force_stop_chain_mesh: true,
      is_keep_mining_person_sound: true,
    });
    CoverTabsCtrlModelPage.open(this, {
      onclose: () => {
        this.routeToVoteDetail();
      },
    });
  }
  /** 监听轮次变动
   *  停止相关的动画
   *  运作变成大金币并落入底部层
   *  然后更新相关的数据
   */
  @TabVotePage.addEvent("ROUND:CHANGED")
  watchRoundChanged(cur_round) {
    if (this.page_status === "vote-detail") {
      if (this._pre_ani_round && this._pre_ani_round === cur_round - 1) {
        this._whenRoundChangeAni(); // 执行动画
      }
      this._pre_ani_round = cur_round;
    }
  }
  private _whenRoundChangeAni() {
    this._stopVoteAnimate({ is_force_stop_chain_mesh: true });
    // 隐藏挖矿动画层，显示大金币
    this.is_show.show_big_fall_icon = true;
    setTimeout(() => {
      // 显示金币掉落动画
      this.is_show.round_ani = true;
      setTimeout(() => {
        this.is_show.show_big_fall_icon = false;
        this.is_show.round_ani = false;
        // 重新开始动画
        this._startVoteAnimate();
      }, 4000);
    }, 1000);
  }
}
