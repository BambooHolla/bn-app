import {
	ViewChild,
	Component,
	Optional,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	ElementRef,
} from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { sleep } from "../../../bnqkl-framework/PromiseExtends";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import {
	IonicPage,
	NavController,
	NavParams,
	ViewController,
} from "ionic-angular";
import {
	LocalContactProvider,
	TagModel,
	LocalContactModel,
} from "../../../providers/local-contact/local-contact";

@IonicPage({ name: "account-tag-detail" })
@Component({
	selector: "page-account-tag-detail",
	templateUrl: "account-tag-detail.html",
})
export class AccountTagDetailPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public cdRef: ChangeDetectorRef,
		public viewCtrl: ViewController,
		public localContact: LocalContactProvider
	) {
		super(navCtrl, navParams, true, tabs);
	}
	tag_info: TagModel = {
		_id: "",
		owner_publicKey: this.userInfo.publicKey,
		name: "",
		contact_ids: [],
		create_time: Date.now(),
	};
	formData = {
		tag_name: "",
	};
	/**是否是添加模式*/
	@AccountTagDetailPage.markForCheck is_create_mode = false;
	/**联系人列表是否处于编辑（可删除）的状态*/
	@AccountTagDetailPage.markForCheck is_edit_contact_list = false;
	/**当前标签关联的联系人列表*/
	@AccountTagDetailPage.markForCheck contact_list: LocalContactModel[] = [];
	/**未修改的情况下原本的的联系人列表*/
	private _source_contact_list: LocalContactModel[] = [];

	@AccountTagDetailPage.willEnter
	initData() {
		const tag_info: TagModel = this.navParams.get("tag");
		if (tag_info) {
			this.tag_info = tag_info;
		} else {
			this.tag_info.contact_ids = this.navParams.get("contact_ids") || [];
		}
		this.is_create_mode = !tag_info;
		this.formData.tag_name = tag_info.name;

		this._loadLocalContactList();
	}

	@asyncCtrlGenerator.error()
	/**从标签中加载本地联系人列表*/
	private async _loadLocalContactList() {
		this.contact_list = (await Promise.all(
			this.tag_info.contact_ids.map(_id =>
				this.localContact.contact_db.findOne({ _id })
			)
		)).filter(contact => contact) as LocalContactModel[];
		this._source_contact_list = this.contact_list.slice();
	}

	/**跳转到多选联系人的页面*/
	gotoAddContact() {
		return this.routeTo("pay-select-my-local-contacts", {
			auto_return: true,
			multiple_selection: true,
			mode: "add-to-tag-contacts",
			selected_address_list: this.contact_list.map(c => c.address),
		});
	}
	/**切换成本地联系人删除模式*/
	toggleRemoveContact() {
		this.is_edit_contact_list = !this.is_edit_contact_list;
	}
	/**移除指定的本地联系人*/
	removeContact(contact: LocalContactModel) {
		const index = this.contact_list.indexOf(contact);
		if (index !== -1) {
			this.contact_list.splice(index, 1);
			if (this.contact_list.length === 0) {
				this.toggleRemoveContact();
			}
		}
	}

	@asyncCtrlGenerator.loading()
	@asyncCtrlGenerator.single()
	@asyncCtrlGenerator.error()
	@asyncCtrlGenerator.success("@@TAG_SAVE_SUCCESS")
	async saveTagDetail() {
		if (this.is_create_mode) {
			const tagName = this.formData.tag_name;
			const contact_list = this.contact_list.slice();
			const new_tag_id = await this.localContact.addTag(
				tagName,
				contact_list.map(c => c._id)
			);
			contact_list.map(contact => {
				contact.tags.push(tagName);
			});
		} else {
			this.tag_info.name = this.formData.tag_name;
			this.tag_info.contact_ids = this.contact_list.map(c => c._id);
			await this.localContact.updateTag(this.tag_info);
		}
		this.finishJob();
	}

	@asyncCtrlGenerator.loading()
	@asyncCtrlGenerator.single()
	@asyncCtrlGenerator.error()
	@asyncCtrlGenerator.success("@@TAG_REMOVE_SUCCESS")
	async deleteTag() {
		await this.localContact.removeTag(this.tag_info._id);
		this.finishJob();
	}
}
