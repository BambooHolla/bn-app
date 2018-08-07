import {
  Component,
  Optional,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
} from "ionic-angular";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { FLP_Tool } from "../../../bnqkl-framework/FLP_Tool";
import { PromiseType } from "../../../bnqkl-framework/PromiseExtends";
import { TabsPage } from "../../tabs/tabs";

import {
  LocalContactModel,
  LocalContactProvider,
  LocalContactGroupItem,
  LocalContactGroupList,
  LocalContactGroupMethod,
} from "../../../providers/local-contact/local-contact";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";

@IonicPage({ name: "account-export-my-local-contacts" })
@Component({
  selector: "page-account-export-my-local-contacts",
  templateUrl: "account-export-my-local-contacts.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountExportMyLocalContactsPage extends SecondLevelPage {
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
    // this.auto_header_shadow_when_scroll_down = true;
  }

  @AccountExportMyLocalContactsPage.markForCheck
  contact_list: LocalContactModel[] = [];
  @AccountExportMyLocalContactsPage.markForCheck
  // 要打印的二维码数据
  export_data = "";

  @AccountExportMyLocalContactsPage.markForCheck is_exporting = true;

  @AccountExportMyLocalContactsPage.willEnter
  @asyncCtrlGenerator.loading("@@IN_EXPORT", undefined, {
    cssClass: "can-tap blockchain-loading",
  })
  async initData() {
    this.is_exporting = true;
    // 导出
    const {
      local_contacts,
      export_data,
    } = await this.localContact.exportLocalContacts();
    this.contact_list = local_contacts;
    this.export_data = export_data;
    this.is_exporting = false;
  }

  is_show_hidden_buttons = false;
  /*隐藏功能*/
  @asyncCtrlGenerator.tttttap()
  tryShowHiddenButtons() {
    this.is_show_hidden_buttons = true;
  }

  @asyncCtrlGenerator.success("@@COPY_SUCCESS")
  /*导出二维码文本到剪切板*/
  tryCopyText() {
    return this.navigatorClipboard.writeText(this.export_data);
  }

  @asyncCtrlGenerator.error("@@LOCAL_CONTACTS_IMPORT_ERROR")
  // @asyncCtrlGenerator.success(
  // 	(
  // 		data: PromiseType<
  // 			ReturnType<
  // 				typeof AccountExportMyLocalContactsPage.prototype.tryImportText
  // 			>
  // 		>,
  // 	) => FLP_Tool.getTranslate("LOCAL_CONTACTS_IMPORT_SUCCESS", data),
  // )
  @asyncCtrlGenerator.loading()
  /*从剪切板中读取器*/
  async tryImportText() {
    const export_data = await this.navigatorClipboard.readText();
    const res = await this.localContact.importLocalContacts(export_data);
    await this.showSuccessDialog(
      "@@LOCAL_CONTACTS_IMPORT_SUCCESS",
      "",
      `成功：${res.success_contacts.length}条；\n跳过：${
        res.skip_contacts.length
      }条；\n失败：${res.error_contacts.length}条；`
    );
  }
}
