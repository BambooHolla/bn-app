import {
  Component,
  Optional,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
} from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
} from "ionic-angular";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
// import { AccountServiceProvider } from "../../../providers/account-service/account-service";
import {
  LocalContactProvider,
  LocalContactModel,
  TagModel,
} from "../../../providers/local-contact/local-contact";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";

type NewTagModel = {
  name: string;
};
type PTagModel = TagModel | NewTagModel;

@IonicPage({ name: "account-remark-contact-tags" })
@Component({
  selector: "page-account-remark-contact-tags",
  templateUrl: "account-remark-contact-tags.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountRemarkContactTagsPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    // public accountService: AccountServiceProvider,
    public localContact: LocalContactProvider,
    public viewCtrl: ViewController,
    public cdRef: ChangeDetectorRef
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  contact!: LocalContactModel;
  /*因为tags都是小数组，所以这里都都直接用indexOf直接搞，不做索引了*/
  all_tags: TagModel[] = [];
  used_tags: PTagModel[] = [];
  selected_tag?: PTagModel;
  formData = {
    new_tag_name: "",
  };

  @AccountRemarkContactTagsPage.willEnter
  async initData() {
    const contact: LocalContactModel | undefined = this.navParams.get(
      "contact"
    );
    if (!contact) {
      return this.navCtrl.goToRoot({});
    }
    this.contact = contact;
    this.markForCheck();
    this.used_tags = contact.tags.map(name => ({ name }));
    this.all_tags = await this.localContact.getTags();
    this.used_tags = this.all_tags.filter(
      t => contact.tags.indexOf(t._id) !== -1
    );
    this.markForCheck();
  }

  // 选中并移除
  selectThenRemoveTag(tag: PTagModel) {
    if (this.selected_tag !== tag) {
      this.selected_tag = tag;
    } else {
      const index = this.used_tags.indexOf(tag);
      this.used_tags.splice(index, 1);
    }
    this.markForCheck();
  }
  // 选中一个，或者取消选择
  selectTag(tag?: PTagModel) {
    this.selected_tag = tag;
    this.markForCheck();
  }
  toggleUseTag(tag: TagModel) {
    const index = this.used_tags.findIndex(t => t.name === tag.name);
    if (index !== -1) {
      this.used_tags.splice(index, 1);
    } else {
      this.used_tags.push(tag);
    }
    this.markForCheck();
  }
  @ViewChild("newTagInputer") newTagInputer!: ElementRef;
  // 准备生成一个新的tag
  addNewTag() {
    if (this.errors.new_tag_name) {
      return;
    }
    const new_tag_name = this.formData.new_tag_name.trim();
    if (new_tag_name) {
      let new_tag: PTagModel;
      // 要去重，移除旧的
      const index = this.used_tags.findIndex(t => t.name === new_tag_name);
      if (index !== -1) {
        new_tag = this.used_tags[index];
        this.used_tags.splice(index, 1);
      } else {
        // 从已经有的里头找
        const index = this.all_tags.findIndex(t => t.name === new_tag_name);
        if (index !== -1) {
          new_tag = this.all_tags[index];
        } else {
          // 否则进行新建
          new_tag = {
            name: new_tag_name,
          };
        }
      }

      this.used_tags.push(new_tag);
      this.resetFormData();
      this.newTagInputer.nativeElement.innerHTML = this.formData.new_tag_name;
      // this.markForCheck();
    }
  }
  onNewTagInput(e: Event) {
    const ele = e.target as HTMLElement;
    this.formData.new_tag_name = (ele.textContent || "").replace(/\n/g, "");
    if (this.formData.new_tag_name !== ele.innerHTML) {
      ele.innerHTML = this.formData.new_tag_name;
    }
  }
  onNewTagKeyDown(e: KeyboardEvent) {
    switch (e.code || e.key) {
      case "Backspace":
        if (this.formData.new_tag_name === "") {
          // 尝试删除，因为是基于keydown事件，所以会连续触发，进行连续删除
          this.selectThenRemoveTag(this.used_tags[this.used_tags.length - 1]);
        }
        break;
      case "Enter":
        this.addNewTag();
        break;
      default:
        // code...
        break;
    }
  }
  @AccountRemarkContactTagsPage.setErrorTo("errors", "new_tag_name", [
    "wrongRange",
  ])
  check_new_tag_name() {
    const over_range = this.formData.new_tag_name.length - 18;
    if (over_range > 0) {
      return {
        // 因为要在页面上直接使用，所以这里直接翻译了
        wrongRange: this.getTranslateSync("TAG_NAME_OVER_RANGE_#MAX#_#NUM#", {
          max: 18,
          num: over_range,
        }),
      };
    }
  }

  // 提交
  @asyncCtrlGenerator.loading()
  async saveContactTags() {
    const { used_tags, contact, all_tags } = this;
    const tag_ids = [] as string[];
    const tag_names = [] as string[];

    const used_tag_id_map = new Set();
    for (var _tag of used_tags) {
      const tag = _tag;
      tag_names.push(tag.name);
      if (!("_id" in tag)) {
        // 没有id的需要进行生成标签
        const new_tag_id = await this.localContact.addTag(_tag.name, [
          contact._id,
        ]);
        tag_ids.push(new_tag_id);
      } else {
        // 有id的需要更新 contact_ids
        if (tag.contact_ids.indexOf(contact._id) === -1) {
          tag.contact_ids.push(contact._id);
          await this.localContact.updateTag(tag);
        }
        used_tag_id_map.add(tag._id);
        tag_ids.push(tag._id);
      }
    }
    for (var _t of all_tags) {
      const tag = _t;
      // 移除ids
      if (!used_tag_id_map.has(tag._id)) {
        const index = tag.contact_ids.indexOf(contact._id);
        if (index !== -1) {
          tag.contact_ids.splice(index, 1);
          this.localContact.updateTag(tag);
        }
      }
    }
    const local_contact = {
      ...this.contact,
      tags: tag_ids,
    };
    await this.localContact.updateLocaContact(local_contact);
    this.jobRes({
      contact_id: local_contact._id,
      tag_ids: tag_ids,
      tag_names: tag_names,
    });
    this.finishJob();
  }
}
