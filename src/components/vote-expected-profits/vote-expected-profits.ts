import {
	Component,
	Input,
	ChangeDetectorRef,
	ChangeDetectionStrategy,
} from "@angular/core";
import {
	BenefitServiceProvider,
	BenefitModel,
} from "../../providers/benefit-service/benefit-service";
import {
	AccountServiceProvider,
	AccountRoundProfitModel,
} from "../../providers/account-service/account-service";

import {
	VoteExtendsPanelComponent,
	DATA_REFRESH_FREQUENCY,
} from "../VoteExtendsPanelComponent";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";

@Component({
	selector: "vote-expected-profits",
	templateUrl: "vote-expected-profits.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteExpectedProfitsComponent extends VoteExtendsPanelComponent {
	constructor(
		cdRef: ChangeDetectorRef,
		public accountService: AccountServiceProvider,
	) {
		super(cdRef);
	}
}
