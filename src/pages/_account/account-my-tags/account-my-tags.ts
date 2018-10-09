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
} from "ionic-angular/index";
import {
	LocalContactProvider,
	TagModel,
} from "../../../providers/local-contact/local-contact";

@IonicPage({ name: "account-my-tags" })
@Component({
	selector: "page-account-my-tags",
	templateUrl: "account-my-tags.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountMyTagsPage extends SecondLevelPage {
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
	@AccountMyTagsPage.markForCheck tag_list: TagModel[] = [];
	page_info = {
		loading: false,
	};

	@AccountMyTagsPage.willEnter
	initData() {
		this.getAllTags();
	}

	@asyncCtrlGenerator.error("@@GET_TAGS_ERROR")
	async getAllTags() {
		this.page_info.loading = true;
		try {
			this.tag_list = await this.localContact.getTags();
		} finally {
			this.page_info.loading = false;
		}
	}
}
