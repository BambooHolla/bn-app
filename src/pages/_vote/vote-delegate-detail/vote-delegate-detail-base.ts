import { ChangeDetectorRef, } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { PromisePro } from "../../../bnqkl-framework/PromiseExtends";
import { TabsPage } from "../../tabs/tabs";
import { NavController, NavParams, } from "ionic-angular/index";
import { MinServiceProvider, DelegateModel, DELEGATE_VOTEABLE } from "../../../providers/min-service/min-service";

export class VoteDelegateDetailBasePage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public tabs: TabsPage,
    public minService: MinServiceProvider,
    public cdRef: ChangeDetectorRef
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
  @VoteDelegateDetailBasePage.markForCheck delegate_info?: DelegateModel;
  @VoteDelegateDetailBasePage.markForCheck current_info_height: number = 0;
  @VoteDelegateDetailBasePage.willEnter
  async initData() {
    let delegate_info: DelegateModel = this.navParams.get("delegate_info");
    if (!delegate_info) {
      const publicKey = this.navParams.get("publicKey");
      if (publicKey) {
        delegate_info = await this.minService.getDelegateInfo(publicKey);
      }
    }
    if (!delegate_info) {
      this.wait_delegate_info.reject();
      this.navCtrl.goToRoot({});
      return;
    }
    this.delegate_info = delegate_info;
    this.current_info_height = this.appSetting.getHeight();
    this.wait_delegate_info.resolve(delegate_info);
    // 更新页面
    this.cdRef.markForCheck();
    // 查询委托人是否可以被投票
    await this.checkCanVoteDelegate();
  }


  readonly DELEGATE_VOTEABLE = DELEGATE_VOTEABLE;
  /**委托人可投与否*/
  @VoteDelegateDetailBasePage.markForCheck delegate_voteable = DELEGATE_VOTEABLE.UNABLE_VOTE;

  /**查询委托人是否可被投票*/
  @VoteDelegateDetailBasePage.addEvent("HEIGHT:CHANGED")
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

  /**对当前委托人进行投票*/
  @asyncCtrlGenerator.success("@@VOTE_THIS_DELEGATE_SUCCESS")
  @asyncCtrlGenerator.error()
  async voteDelegate() {
    const { delegate_info } = this;
    if (!delegate_info) {
      return;
    }
    if (!(await this.waitTipDialogConfirm("@@VOTE_ONE_DELEGATE_TIP"))) {
      return;
    }
    const form = await this.getUserPassword({
      custom_fee: true,
    });
    await this.minService.tryVote(
      [delegate_info],
      undefined,
      {
        password: form.password,
        pay_pwd: form.pay_pwd,
        fee: form.custom_fee ? form.custom_fee.toString() : undefined,
      },
      this
    );
  }
}
