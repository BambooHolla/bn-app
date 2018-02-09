import { Component, Input } from "@angular/core";
import {
	RateOfReturnModel,
	MinServiceProvider,
} from "../../providers/min-service/min-service";

import { VoteExtendsPanelComponent } from "../VoteExtendsPanelComponent";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";

@Component({
	selector: "vote-pre-round-income-rate",
	templateUrl: "vote-pre-round-income-rate.html",
})
export class VotePreRoundIncomeRateComponent extends VoteExtendsPanelComponent {
	@Input("show-detail")
	set show_detail(v) {
		this.setShowDetail(v);
	}
	get show_detail() {
		return this._show_detail;
	}
	constructor(public minService: MinServiceProvider) {
		super();
	}

	pre_round_income_rate?: RateOfReturnModel;
	async refreshBaseData() {
		this.pre_round_income_rate = (await this.minService.rateOfReturn.getPromise()) || {
			totalBenefit: 0,
			totalFee: 0,
			rateOfReturn: 0,
		};
	}
}
