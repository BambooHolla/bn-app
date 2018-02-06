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

@IonicPage({ name: "tab-vote" })
@Component({
  selector: "page-tab-vote",
  templateUrl: "tab-vote.html",
})
export class TabVotePage extends FirstLevelPage {
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
          console.log("ani diff_time", diff_time);
          const BLOCK_UNIT_TIME = this.appSetting.BLOCK_UNIT_TIME;
          if (diff_time < BLOCK_UNIT_TIME) {
            if (can_run() && this.satellite_pixi) {
              if (immediate) {
                // 立即更新现在的进度
                this.satellite_pixi.setProgress(diff_time / BLOCK_UNIT_TIME, 0);
              }
              this.satellite_pixi.setProgress(1, BLOCK_UNIT_TIME - diff_time);
              this.satellite_pixi.setProgress(1, BLOCK_UNIT_TIME - diff_time);
            }
          } else {
            // 延迟了，等
            const ani_dur = 1000;
            const doWaitingAni = () => {
              if (this.satellite_pixi) {
                this.satellite_pixi.setProgress(
                  this.satellite_pixi.progress + 1,
                  ani_dur,
                  Easing.Quartic_InOut,
                );
              } else {
                clearInterval(this._waiting_ani);
              }
            };
            doWaitingAni();
            this._waiting_ani = setInterval(doWaitingAni, ani_dur);
          }
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
    this.buddha_glow &&
      this.buddha_glow.is_inited &&
      this.buddha_glow.startAnimation();
    if (!this.is_show._inited) {
      this.is_show._inited = true;
      setTimeout(() => {
        // 先显示阳光
        this.is_show.buddha_glow = true;
        setTimeout(() => {
          // 再显示卫星
          this.is_show.satellite_pixi = true;
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
    this._startVoteAnimate();

    const { _earth_enabled_config, earth_config } = this;
    for (const key in _earth_enabled_config) {
      const from = earth_config[key];
      const to = _earth_enabled_config[key];

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
  private _stopVoteAnimate(opts: { is_force_stop_chain_mesh?: boolean } = {}) {
    this.fall_coin &&
      this.fall_coin.is_inited &&
      this.fall_coin.stopAnimation();
    this.satellite_pixi &&
      this.satellite_pixi.is_inited &&
      this.satellite_pixi.stopAnimation();
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
              this.translate.instant("CANCEL"),
              {
                text: this.translate.instant("OK"),
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
      const pwdData = await this.getUserPassword();
      await this.minService
        .vote(pwdData.password, pwdData.pay_pwd)
        .catch(err => {
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
      this.getPreRoundRankList();
      this.getCurRoundIncomeInfo();
      // // FAKE ANI
      // setTimeout(() => {
      //   if (!this.is_show.show_big_fall_icon) {
      //     this._whenRoundChangeAni();
      //   }
      // }, 1000);
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

  /**上一轮的收益排名*/
  pre_round_rank_list?: RankModel[];
  pre_round_my_benefit?: RankModel;
  @TabVotePage.willEnter
  @asyncCtrlGenerator.retry()
  async getPreRoundRankList() {
    if (this.page_status == "vote-detail") {
      this.pre_round_rank_list = await this.minService.myRank.getPromise();
      this.pre_round_my_benefit = this.pre_round_rank_list.find(
        rank_info => rank_info.address == this.userInfo.address,
      );
    }
  }

  /**收益趋势图*/
  income_trend_list?: BenefitModel[];
  @TabVotePage.willEnter
  @asyncCtrlGenerator.retry()
  async getIncomeTrendList() {
    if (this.page_status == "vote-detail") {
      const income_trend_list = await this.benefitService.top57Benefits.getPromise();
      this.income_trend_list = income_trend_list.length
        ? income_trend_list
        : undefined;
    }
  }

  /**本轮挖矿收益 */
  cur_round_income_info = {
    round: 0,
    block_num: 0,
    cur_round_income_amount: 0,
    recent_income_amount: 0,
  };
  @TabVotePage.willEnter
  @asyncCtrlGenerator.retry()
  async getCurRoundIncomeInfo() {
    if (this.page_status == "vote-detail") {
      const { cur_round_income_info } = this;
      cur_round_income_info.round = this.appSetting.getRound();
      cur_round_income_info.block_num = await this.blockService.myForgingCount.getPromise();
      cur_round_income_info.cur_round_income_amount = await this.benefitService.benefitThisRound.getPromise();
      cur_round_income_info.recent_income_amount = await this.benefitService.recentBenefit.getPromise();
    }
  }

  /**获取上一轮的投资回报率*/
  pre_round_income_rate?: RateOfReturnModel;
  @TabVotePage.willEnter
  @asyncCtrlGenerator.retry()
  async getPreRoundIncomeRate() {
    if (this.page_status == "vote-detail") {
      this.pre_round_income_rate = await this.minService.rateOfReturn.getPromise();
    }
  }

  /**动画的进度监控*/
  @TabVotePage.autoUnsubscribe private _height_subscription?: Subscription;
  @TabVotePage.willEnter
  watchHeightChanged() {
    if(!this._height_subscription){
      let is_first = true;
      this._height_subscription = this.appSetting.height.subscribe(height => {
        if (this.page_status === VotePage.VoteDetail) {
          this._set_fall_coin_progress();
          this._set_satellite_pixi_progress(is_first);
          // TODO:我的贡献？
          is_first = false;
        }
      });
    }
  }

  @TabVotePage.autoUnsubscribe _round_subscription?: Subscription;
  /** 监听轮次变动
   *  停止相关的动画
   *  运作变成大金币并落入底部层
   *  然后更新相关的数据
   */
  watchRoundChanged() {
    if (this._round_subscription) {
      return;
    }
    this._round_subscription = this.appSetting.round.subscribe(() => {
      if (this.page_status === "vote-detail") {
        this._whenRoundChangeAni(); // 执行动画
        // TODO:数据的变动应该与动画同时触发
        this.getPreRoundRankList();
        this.getIncomeTrendList();
        this.getCurRoundIncomeInfo();
      }
    });
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

export enum VotePage {
  None = "",
  Bootstrap = "bootstrap",
  VoteDetail = "vote-detail",
}
