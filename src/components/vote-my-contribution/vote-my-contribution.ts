import {
  Component,
  Input,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  OnDestroy,
} from "@angular/core";
import {
  BenefitServiceProvider,
  BenefitModel,
} from "../../providers/benefit-service/benefit-service";

import { VoteExtendsPanelComponent } from "../VoteExtendsPanelComponent";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";

@Component({
  selector: "vote-my-contribution",
  templateUrl: "vote-my-contribution.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteMyContributionComponent extends VoteExtendsPanelComponent
  implements OnDestroy {
  @Input("show-detail")
  set show_detail(v) {
    this.setShowDetail(v);
  }
  get show_detail() {
    return this._show_detail;
  }
  constructor(cdRef: ChangeDetectorRef) {
    super(cdRef);
    this.watch_detal_tran_num_changed = this.watch_detal_tran_num_changed.bind(
      this
    );
    this.watch_contribution_flow_changed = this.watch_contribution_flow_changed.bind(
      this
    );
    this.appSetting.on(
      "changed@setting.detal_tran_num",
      this.watch_detal_tran_num_changed
    );
    this.appSetting.on(
      "changed@setting.contribution_flow",
      this.watch_contribution_flow_changed
    );
  }
  watch_detal_tran_num_changed(new_v) {
    this.my_contribution.detal_tran_num = new_v;
    this.cdRef.markForCheck();
  }
  watch_contribution_flow_changed(new_v) {
    this.my_contribution.contribution_flow = new_v;
    this.cdRef.markForCheck();
  }

  ngOnDestroy() {
    super.ngOnDestroy();

    this.appSetting.off(
      "changed@setting.detal_tran_num",
      this.watch_detal_tran_num_changed
    );
    this.appSetting.off(
      "changed@setting.contribution_flow",
      this.watch_contribution_flow_changed
    );
  }

  my_contribution = {
    detal_tran_num: 0,
    contribution_flow: 0,
  };

  async refreshBaseData() {}
  async refreshDetailData() {}
}
