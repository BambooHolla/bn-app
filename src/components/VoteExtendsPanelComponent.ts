import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  HostBinding,
  ChangeDetectorRef,
} from "@angular/core";
import { BenefitServiceProvider } from "../providers/benefit-service/benefit-service";
import { AppSettingProvider } from "../providers/app-setting/app-setting";
import { UserInfoProvider } from "../providers/user-info/user-info";
import { FLP_Tool, tryRegisterGlobal } from "../bnqkl-framework/FLP_Tool";
import { Subscription } from "rxjs/Subscription";
import { AlertController, ToastController } from "ionic-angular";
import EventEmitter from "eventemitter3";
import { asyncCtrlGenerator } from "../bnqkl-framework/Decorator";

export enum DATA_REFRESH_FREQUENCY {
  BY_ROUND,
  BY_HEIGHT,
}

export class VoteExtendsPanelComponent extends EventEmitter
  implements OnInit, OnDestroy {
  @FLP_Tool.FromGlobal appSetting!: AppSettingProvider;
  @FLP_Tool.FromGlobal benefitService!: BenefitServiceProvider;
  @FLP_Tool.FromGlobal alertCtrl!: AlertController;
  @FLP_Tool.FromGlobal toastCtrl!: ToastController;
  @FLP_Tool.FromGlobal userInfo!: UserInfoProvider;
  constructor(public cdRef: ChangeDetectorRef) {
    super();
    tryRegisterGlobal("extendsPanelOf" + this.constructor.name, this);
  }
  static DATA_REFRESH_FREQUENCY = DATA_REFRESH_FREQUENCY;
  data_refresh_frequency = DATA_REFRESH_FREQUENCY.BY_ROUND;

  @HostBinding("class.show-detail") _show_detail = false;
  setShowDetail(v: boolean) {
    v = !!v;
    if (this._show_detail !== v) {
      this._show_detail = v;
      if (this._is_inited) {
        this.refreshData();
      }
    }
  }

  private _is_inited = false;
  private _token_subscript?: Subscription;
  ngOnInit() {
    this._token_subscript = this.appSetting.account_address.subscribe(() => {
      if (!this._is_inited) {
        this.refreshData();
      }
    });
    this.on("HEIGHT:CHANGED", () => {
      if (this.appSetting.getUserToken()) {
        this.refreshCommonData();
      } else {
        console.log("NO LOGIN ,IGNORE");
      }

      if (this.data_refresh_frequency !== DATA_REFRESH_FREQUENCY.BY_HEIGHT) {
        return;
      }
      // this.emit("roundChanged");
      if (this.appSetting.getUserToken()) {
        this.refreshData();
      }
    });
    this.on("ROUND:CHANGED", () => {
      if (this.data_refresh_frequency !== DATA_REFRESH_FREQUENCY.BY_ROUND) {
        return;
      }
      // this.emit("roundChanged");
      if (this.appSetting.getUserToken()) {
        this.refreshData();
      }
    });
    this._is_inited = true;
  }
  ngOnDestroy() {
    this._token_subscript && this._token_subscript.unsubscribe();
    this.removeAllListeners();
  }
  cur_round_income_amount = 0;

  @asyncCtrlGenerator.error()
  @asyncCtrlGenerator.retry(undefined, console.warn)
  private async refreshData() {
    if (this._show_detail) {
      await this.refreshDetailData();
    } else {
      await this.refreshBaseData();
    }
    this.cdRef.markForCheck();
    this.cdRef.detectChanges();
  }

  @asyncCtrlGenerator.error()
  @asyncCtrlGenerator.retry(undefined, console.warn)
  private async refreshCommonData(): Promise<any> {
    this.cur_round_income_amount = await this.benefitService.benefitThisRound.getPromise();
    console.log("this.cur_round_income_amount", this.cur_round_income_amount);
    this.cdRef.markForCheck();
    this.cdRef.detectChanges();
  }
  async refreshBaseData(): Promise<any> {
    throw new Error("refreshBaseData没有定义");
  }
  /*必须重写这个方法*/
  async refreshDetailData(): Promise<any> {
    throw new Error("refreshDetailData没有定义");
  }

  toDateMS = FLP_Tool.toDateMS;
}
