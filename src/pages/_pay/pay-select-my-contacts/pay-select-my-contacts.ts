import { Component, Optional } from "@angular/core";
import {
	IonicPage,
	NavController,
	NavParams,
	ViewController,
} from "ionic-angular";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { AccountServiceProvider } from "../../../providers/account-service/account-service";
import {
	ContactServiceProvider,
	ContactModel,
	ContactGroupList,
	ContactGroupItem,
} from "../../../providers/contact-service/contact-service";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";

@IonicPage({ name: "pay-select-my-contacts" })
@Component({
	selector: "page-pay-select-my-contacts",
	templateUrl: "pay-select-my-contacts.html",
})
export class PaySelectMyContactsPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public accountService: AccountServiceProvider,
		public contactService: ContactServiceProvider,
		public viewCtrl: ViewController,
	) {
		super(navCtrl, navParams, true, tabs);
		this.auto_header_shadow_when_scroll_down = true;
	}
	my_contact_list: ContactGroupList = [];
	confirmed_contact_list: ContactModel[] = [];
	listTrackBy(item, contact: ContactModel) {
		return contact.address;
	}
	loading_my_contact_list = false;
	// @PaySelectMyContactsPage.willEnter
	async loadMyContactList() {
		this.loading_my_contact_list = true;
		const contact_parser = this.contactService.contactModelDiffParser;
		try {
			const {
				following: confirmed_contact_list,
			} = await this.contactService.myContact.getPromise();

			if (
				this.isArrayDiff(
					this.confirmed_contact_list,
					confirmed_contact_list,
					contact_parser,
				)
			) {
				this.confirmed_contact_list = confirmed_contact_list;
				// 将已有的联系人进行分组
				const grouped_contact = this.contactService.contactGroup(
					confirmed_contact_list,
				);
				this.my_contact_list = grouped_contact;
			}
		} finally {
			this.loading_my_contact_list = false;
		}
	}

	/*点击联系人*/
	tapContact(contact: ContactModel) {
		const mode = this.navParams.get("mode");
		if (mode === "select-address") {
			this.jobRes(contact);
			this.finishJob();
		}
	}

	// TODO: 这个页面不根据高度实时刷新，因为可能是一个大列表

	@PaySelectMyContactsPage.addEvent("HEIGHT:CHANGED")
	@asyncCtrlGenerator.error(
		"更新联系人列表失败，重试次数过多，已停止重试，请检测网络",
	)
	@asyncCtrlGenerator.retry()
	watchHeightChanged() {
		return this.loadMyContactList();
	}
}
