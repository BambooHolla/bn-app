import { Component, Optional, ViewChild, ElementRef } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  Refresher,
  Content,
  ViewController,
} from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { LATEST_VERSION_INFO } from "./version.types";
import {
  FileTransfer,
  FileUploadOptions,
  FileTransferObject,
} from "@ionic-native/file-transfer";
import { File } from "@ionic-native/file";
import { FileOpener } from "@ionic-native/file-opener";

type buttonOptions = {
  text: string;
  handler?: Function;
  cssClass?: string;
};

@IonicPage({ name: "version-update-dialog" })
@Component({
  selector: "page-version-update-dialog",
  templateUrl: "version-update-dialog.html",
})
export class VersionUpdateDialogPage extends FirstLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public transfer: FileTransfer,
    public file: File,
    public fileOpener: FileOpener,
  ) {
    super(navCtrl, navParams);
  }
  version_info!: LATEST_VERSION_INFO;
  initData() {
    this.version_info = this.navParams.get("version_info");
    if (!this.version_info) {
      this.closeDialog();
    }
  }
  closeDialog() {
    this.viewCtrl.dismiss();
  }
  @asyncCtrlGenerator.error("@@UPDATE_APK_FAIL")
  async androidUpadate() {
    const fileTransfer: FileTransferObject = this.transfer.create();
    const apk_url = this.version_info.download_link_android;
    const filename = apk_url.split("/").pop();
    // fileTransfer.
    const dialog = await this._showCustomDialog({
      title: "准备开始下载……",
    });
    fileTransfer.onProgress(e => {
      console.log(e);
      dialog.setTitle(`下载中`);
      dialog.setMessage(`${(e.loaded / e.total * 100).toFixed(2)}%`);
    });
    const entry = await fileTransfer.download(
      apk_url,
      this.file.dataDirectory + filename,
    );
    dialog.setTitle("下载完成，准备安装……");
    dialog.setMessage("");
    console.log("download complete: " + entry.toURL());
    await this.fileOpener.open(
      entry.toURL(),
      "application/vnd.android.package-archive",
    );
    return dialog.dismiss();
  }
}
