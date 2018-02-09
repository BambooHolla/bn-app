import { Component, Input } from "@angular/core";
import {
	BenefitServiceProvider,
	BenefitModel,
} from "../../providers/benefit-service/benefit-service";

import { VoteExtendsPanelComponent } from "../VoteExtendsPanelComponent";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";

@Component({
	selector: "vote-my-contribution",
	templateUrl: "vote-my-contribution.html",
})
export class VoteMyContributionComponent extends VoteExtendsPanelComponent {
	@Input("show-detail")
	set show_detail(v) {
		this.setShowDetail(v);
	}
	get show_detail() {
		return this._show_detail;
	}
	constructor() {
		super();
	}

	my_contribution = {};

	async refreshBaseData() {
		console.error("还未接入“我的贡献”相关的接口");
	}
	async refreshDetailData(){
		
	}
}
