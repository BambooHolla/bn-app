import {
  Component,
  Optional,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
} from "../../../providers/local-contact/local-contact";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";

@IonicPage({ name: "account-remark-contact" })
@Component({
  selector: "page-account-remark-contact",
  templateUrl: "account-remark-contact.html",
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountRemarkContactPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    // public accountService: AccountServiceProvider,
    public localContact: LocalContactProvider,
    public viewCtrl: ViewController,
    public cdRef: ChangeDetectorRef,
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  contact!: LocalContactModel;

  @AccountRemarkContactPage.willEnter
  initData() {
    const contact: LocalContactModel = this.navParams.get("contact");
    if (!contact) {
      return this.navCtrl.goToRoot({});
    }
    this.contact = contact;
    this.formData.nickname = contact.nickname || "";
    this.formData.tags = contact.tags.slice();
    this.formData.phones = contact.phones
      .map(phone => {
        phone = phone.trim();
        if (phone) {
          return { value: phone };
        }
      })
      .filter(v => v) as any;
    // 提供一个基本的占位输入
    this._tryAddPhoneInput();
    this.markForCheck();
  }

  formData = {
    nickname: "",
    tags: [] as string[],
    phones: [] as { value: string }[],
    remark: "",
    image: null,
  };
  ignore_keys = ["nickname", "tags", "phones", "remark", "image"];

  clearNickName() {
    this.formData.nickname;
  }

  onPhoneItemChanged(index: number) {
    const { phones } = this.formData;
    const phone = phones[index];
    if (phone.value.trim() === "") {
      if (phones.length > 1) {
        phones.splice(index, 1);
        this.markForCheck();
      }
    } else {
      //如果是最后一个，则进行自动增加
      if (index === phones.length - 1) {
        this._tryAddPhoneInput();
      }
    }
  }
  private _tryAddPhoneInput() {
    if (this.formData.phones.length < 5) {
      this.formData.phones.push({ value: "" });
      this.markForCheck();
    }
  }

  removePhoneItem(index: number) {
    this.formData.phones.splice(index, 1);
    this.markForCheck();
  }

  @ViewChild("remarkTextArea") remarkTextArea!: ElementRef;
  autoResizeRemarkTextArea() {
    const textAreaNode = this.remarkTextArea
      .nativeElement as HTMLTextAreaElement;
    if (textAreaNode) {
      textAreaNode.style.height = "5px";
      textAreaNode.style.height = textAreaNode.scrollHeight + "px";
    }
  }
}
