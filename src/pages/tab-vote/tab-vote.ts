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
import { AniBase } from "../../components/AniBase";
import { TabsPage } from "../tabs/tabs";
import {
  MinServiceProvider,
  RankModel,
} from "../../providers/min-service/min-service";
import { AccountServiceProvider } from "../../providers/account-service/account-service";
import { HEIGHT_AB_Generator } from "../../providers/app-setting/app-setting";

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
  ) {
    super(navCtrl, navParams);
  }
  account_info = {
    balance: 8.88888888,
  };
  @TabVotePage.didEnter
  hiddenTabBg() {
    this.tabs.setBgTransparent(this.page_status === "bootstrap", this.cname);
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

  page_status = "bootstrap";
  routeToVoteDetail() {
    this.tabs.setBgTransparent(false, this.cname);
    this.page_status = "vote-detail";
    this.fall_coin &&
      this.fall_coin.is_inited &&
      this.fall_coin.startAnimation();
    clearInterval(this["_fall_coin_progress_ti"]);
    this["_fall_coin_progress_ti"] = setInterval(() => {
      if (this.fall_coin) {
        this.fall_coin.progress = parseFloat(
          ((this.fall_coin.progress + 0.001) % 1).toFixed(4),
        );
      } else {
        clearInterval(this["_fall_coin_progress_ti"]);
      }
    }, 100);

    this.satellite_pixi &&
      this.satellite_pixi.is_inited &&
      this.satellite_pixi.startAnimation();
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
  routeToBootstrap() {
    this.tabs.setBgTransparent(true, this.cname);
    this.page_status = "bootstrap";
    this.fall_coin &&
      this.fall_coin.is_inited &&
      this.fall_coin.stopAnimation();
    this.satellite_pixi &&
      this.satellite_pixi.is_inited &&
      this.satellite_pixi.stopAnimation();
    this.buddha_glow &&
      this.buddha_glow.is_inited &&
      this.buddha_glow.stopAnimation();

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
          this.chain_mesh && this.chain_mesh.app && this.chain_mesh.app.ticker.update();
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
      const pwdData = await this.getUserPassword();
      await this.minService.vote(pwdData.password, pwdData.pay_pwd);
      this.routeToVoteDetail();
      this.getPreRoundRankList();
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

  /**上一轮的排名*/
  @TabVotePage.autoUnsubscribe private _my_rank_subscription?: Subscription;
  pre_round_rank_list?: RankModel[];
  @TabVotePage.willEnter
  getPreRoundRankList() {
    if (!this._my_rank_subscription && this.page_status == "vote-detail") {
      this._my_rank_subscription = this.minService.myRank.subscribe(
        rank_list => {
          this.pre_round_rank_list = rank_list;
        },
      );
    }
  }

  get pre_round_rank_list_pre() {
    return this.pre_round_rank_list && this.pre_round_rank_list[0];
  }
  get pre_round_rank_list_cur() {
    return this.pre_round_rank_list && this.pre_round_rank_list[1];
  }
  get pre_round_rank_list_next() {
    return this.pre_round_rank_list && this.pre_round_rank_list[2];
  }
}
