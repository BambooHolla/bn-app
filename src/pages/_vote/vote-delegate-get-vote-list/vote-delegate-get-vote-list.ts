import { Component, Optional, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular/index";
import { PromisePro } from "../../../bnqkl-framework/PromiseExtends";
import { MinServiceProvider, DelegateModel, DELEGATE_VOTEABLE } from "../../../providers/min-service/min-service";

@IonicPage({ name: "vote-delegate-get-vote-list" })
@Component({
	selector: "page-vote-delegate-get-vote-list",
	templateUrl: "vote-delegate-get-vote-list.html",
})
export class VoteDelegateGetVoteListPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public cdRef: ChangeDetectorRef,
		public minService: MinServiceProvider
	) {
		super(navCtrl, navParams, true, tabs);
	}
	_wait_delegate_info?: PromisePro<DelegateModel>;
	get wait_delegate_info() {
		if (!this._wait_delegate_info) {
			this._wait_delegate_info = new PromisePro();
		}
		return this._wait_delegate_info;
	}
	@VoteDelegateGetVoteListPage.markForCheck delegate_info?: DelegateModel;

	vote_list: any[] = [];
	@VoteDelegateGetVoteListPage.willEnter
	fakeData() {
		this.vote_list = Array.from({ length: 60 }, (_, i) => {
			return {
				address: "cLJ8Z8bNz3Rif5PdYEzdq32v4M8RawmBnH",
				vote_count: (i + Math.random() * 200) | 0,
			};
		});
	}

	readonly DELEGATE_VOTEABLE = DELEGATE_VOTEABLE;
	/**委托人可投与否*/
	@VoteDelegateGetVoteListPage.markForCheck delegate_voteable = DELEGATE_VOTEABLE.UNABLE_VOTE;
	/**查询委托人是否可被投票*/
	@VoteDelegateGetVoteListPage.addEvent("HEIGHT:CHANGED")
	@asyncCtrlGenerator.error()
	@asyncCtrlGenerator.single()
	async checkCanVoteDelegate() {
		if (!this.delegate_info) {
			return;
		}
		this.delegate_voteable = DELEGATE_VOTEABLE.CHEKCING;
		try {
			const voteable = await this.minService.checkDelegateVoteAble(this.delegate_info.publicKey);
			this.delegate_voteable = voteable ? DELEGATE_VOTEABLE.VOTEABLE : DELEGATE_VOTEABLE.UNABLE_VOTE;
		} catch {
			this.delegate_voteable = DELEGATE_VOTEABLE.VOTEABLE;
		}
	}
}
