import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { BenefitServiceProvider } from "../providers/benefit-service/benefit-service";
import { AppSettingProvider } from "../providers/app-setting/app-setting";
import { UserInfoProvider } from '../providers/user-info/user-info'
import { FLP_Tool } from '../bnqkl-framework/FLP_Tool'
import { Subscription } from "rxjs/Subscription";
import { AlertController, ToastController } from "ionic-angular";
import { EventEmitter } from "eventemitter3";
import { asyncCtrlGenerator } from "../bnqkl-framework/Decorator";

export class VoteExtendsPanelComponent extends EventEmitter implements OnInit, OnDestroy {
	@FLP_Tool.FromGlobal appSetting!: AppSettingProvider
	@FLP_Tool.FromGlobal benefitService!: BenefitServiceProvider
	@FLP_Tool.FromGlobal alertCtrl!: AlertController;
	@FLP_Tool.FromGlobal toastCtrl!: ToastController;
	@FLP_Tool.FromGlobal userInfo!: UserInfoProvider;

	_show_detail = false
	setShowDetail(v: boolean) {
		v = !!v;
		if (this._show_detail !== v) {
			this._show_detail = v;
			if (this._is_inited) {
				this.refreshData();
			}
		}
	};

	private _is_inited = false;
	private _round_subscript?: Subscription;
	ngOnInit() {
		this._round_subscript = this.appSetting.round.subscribe(this.refreshData.bind(this));
		this._is_inited = true;
	}
	ngOnDestroy() {
		this._round_subscript && this._round_subscript.unsubscribe();
	}
	cur_round_income_amount = 0;

	@asyncCtrlGenerator.error()
	@asyncCtrlGenerator.retry()
	private async refreshData() {
		const tasks: Promise<any>[] = []
		tasks[tasks.length] = this.refreshCommonData();
		if (this._show_detail) {
			tasks[tasks.length] = this.refreshDetailData();
		} else {
			tasks[tasks.length] = this.refreshBaseData();
		}
		Promise.all(tasks);
	}

	private async refreshCommonData(): Promise<any> {
		this.cur_round_income_amount = await this.benefitService.benefitThisRound.getPromise();
	}
	async refreshBaseData(): Promise<any> {
		throw new Error("refreshBaseData没有定义");
	}
	/*必须重写这个方法*/
	async refreshDetailData(): Promise<any> {
		throw new Error("refreshDetailData没有定义");
	}
}
