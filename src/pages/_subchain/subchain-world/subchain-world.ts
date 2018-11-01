import { Component, Optional, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { IonicPage, NavController, NavParams, ViewController, ModalController, PopoverController } from "ionic-angular/index";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { TransactionServiceProvider } from "../../../providers/transaction-service/transaction-service"
import { SubchainServiceProvider, SubchainModelWithSafeUrl } from "../../../providers/subchain-service/subchain-service"
import { ModalComponent } from '../../../components/modal/modal';
import { PopoverComponent } from '../../../components/popover/popover';

@IonicPage({ name: "subchain-world" })
@Component({
  selector: "page-subchain-world",
  templateUrl: "subchain-world.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubchainWorldPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public cdRef: ChangeDetectorRef,
    public viewCtrl: ViewController,
    public transactionService: TransactionServiceProvider,
    public subchainService: SubchainServiceProvider,
    public popoverCtrl: PopoverController,
    public modalCtrl: ModalController
  ) {
    super(navCtrl, navParams, true, tabs);
  }

  presentPopover(event) {
    let popover = this.popoverCtrl.create(PopoverComponent, {}, { cssClass: 'popover' });
    popover.present({
      ev: event
    });
  }

  presentModal() {
    let subchainModal = this.modalCtrl.create(ModalComponent, { subchainList: this.subchain_list }, { cssClass: 'modal-subchain' });
    subchainModal.present();
  }

  @SubchainWorldPage.markForCheck
  subchain_list: SubchainModelWithSafeUrl[] = [];

  page_info = {
    loading: false,
    has_more: true,
    page: 1,
    pageSize: 10
  }

  @SubchainWorldPage.willEnter
  @asyncCtrlGenerator.error()
  @asyncCtrlGenerator.loading()
  async initData() {
    await this.initSubchainList();
  }

  /**init data */
  @asyncCtrlGenerator.error()
  async initSubchainList() {
    this.page_info.page = 1;
    this.subchain_list = await this._loadSubchainList();
  }

  /**load more */
  @asyncCtrlGenerator.error()
  async loadMoreSubchainList() {
    if (!this.page_info.has_more) {
      return
    }
    this.page_info.page += 1;
    this.subchain_list = this.subchain_list.concat(await this._loadSubchainList());
  }

  /**fetching subchain list data */
  private async _loadSubchainList() {
    const { page_info } = this;
    try {
      page_info.loading = true;
      const subchain_list = await this.subchainService.getSubchainList({}, (page_info.page - 1) * page_info.pageSize, page_info.pageSize);
      page_info.has_more = subchain_list.length >= page_info.pageSize;
      return this.subchainService.formatSubchainsToWithAssetsSafeUrl(subchain_list);
    } finally {
      page_info.loading = false;
    }
  }

}
