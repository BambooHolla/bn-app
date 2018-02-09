import { Component, Input } from "@angular/core";
import {
	MinServiceProvider,
	RankModel,
} from "../../providers/min-service/min-service";

import { VoteExtendsPanelComponent } from "../VoteExtendsPanelComponent";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";

@Component({
	selector: "vote-pre-round-income-ranking",
	templateUrl: "vote-pre-round-income-ranking.html",
})
export class VotePreRoundIncomeRankingComponent extends VoteExtendsPanelComponent {
	constructor(public minService: MinServiceProvider) {
		super();
	}
	@Input("show-detail")
	set show_detail(v) {
		this.setShowDetail(v);
	}
	get show_detail() {
		return this._show_detail;
	}

	pre_round_rank_list?: RankModel[];
	async refreshBaseData() {
		this.pre_round_rank_list = await this.minService.myRank.getPromise();
	}
	async refreshDetailData(){
		
	}
}
