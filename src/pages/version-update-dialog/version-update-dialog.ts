import { Component, Optional, ViewChild, ElementRef } from "@angular/core";
import { DomSanitizer, SafeStyle } from "@angular/platform-browser";
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

export function versionToNumber(version: string) {
  const vcodes = version.split(".");
  /* 一共分三位：
   * 大版本号：*100000
   * 中版本号：*1000
   * 小版本号：*1
   * 小版本尾号(1.1.1-2中的2)：*0.0001
   */
  var res = 0;
  res += (parseInt(vcodes[0]) || 0) * 100000;
  res += (parseInt(vcodes[1]) || 0) * 1000;
  const last_info = vcodes[1].split("-");
  res += parseInt(last_info[0]) || 0;
  res += (parseInt(last_info[1]) || 0) * 0.0001;
  return res;
}

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
    public sanitizer: DomSanitizer,
  ) {
    super(navCtrl, navParams);
  }
  version_info!: LATEST_VERSION_INFO;
  @VersionUpdateDialogPage.willEnter
  initData() {
    this.version_info = this.navParams.get("version_info");
    if (!this.version_info) {
      this.closeDialog();
    }
  }
  closeDialog() {
    if (this.isDownloading) {
      this.showConfirmDialog(
        this.getTranslateSync("ENSURE_TO_CANCEL_UPDATE"),
        () => {
          this.fileTransfer && this.fileTransfer.abort();
          this.viewCtrl.dismiss();
        },
      );
    } else {
      this.viewCtrl.dismiss();
    }
  }
  get changelogs() {
    if (!this.version_info) {
      return undefined;
    }
    var res = this.version_info.changelogs;
    if (this.isAndroid) {
      if (this.version_info.android_changelogs) {
        res = this.version_info.android_changelogs;
      }
    }
    if (this.isIOS) {
      if (this.version_info.ios_changelogs) {
        res = this.version_info.ios_changelogs;
      }
    }
    return res;
  }
  fileTransfer?: FileTransferObject;
  isDownloading = false;
  download_progress: SafeStyle = "--progress:0%";
  @asyncCtrlGenerator.error("@@UPDATE_APK_FAIL")
  async androidUpadate() {
    this.isDownloading = true;
    try {
      this.fileTransfer = this.transfer.create();
      const apk_url = this.version_info.download_link_android;
      const filename = apk_url.split("/").pop();
      // fileTransfer.

      this.download_progress = this.sanitizer.bypassSecurityTrustStyle(
        "--progress:0%",
      );
      this.fileTransfer.onProgress(e => {
        this.download_progress = this.sanitizer.bypassSecurityTrustStyle(
          `--progress:${e.loaded / e.total * 100}%`,
        );
      });
      const entry = await this.fileTransfer.download(
        apk_url,
        this.file.dataDirectory + filename,
      );
      this.fileTransfer = undefined;
      this.isDownloading = false;

      console.log("download complete: " + entry.toURL());
      await this.fileOpener.open(
        entry.toURL(),
        "application/vnd.android.package-archive",
      );
    } finally {
      this.isDownloading = false;
    }
  }
  backgroundDownload() {
    this.viewCtrl.dismiss();
  }

  iosUpdatge() {
    if (this.version_info.itunes_link) {
      // TODO, 使用app store进行更新
    } else {
      // TODO, 测试plist是否可以通过这种方式更新
      window.open(this.version_info.download_link_web, "_system");
    }
  }
  static versionToNumber = versionToNumber;
}
