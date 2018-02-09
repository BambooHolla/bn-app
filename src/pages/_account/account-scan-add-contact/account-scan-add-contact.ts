import { ViewChild, ElementRef, Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
} from "ionic-angular";
// import * as Instascan from "instascan";
// window["Instascan"] = Instascan;
import { QRScanner, QRScannerStatus } from "@ionic-native/qr-scanner";
import { ContactServiceProvider } from "../../../providers/contact-service/contact-service";

@IonicPage({ name: "account-scan-add-contact" })
@Component({
  selector: "page-account-scan-add-contact",
  templateUrl: "account-scan-add-contact.html",
})
export class AccountScanAddContactPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public qrScanner: QRScanner,
    public contactService: ContactServiceProvider,
    public viewCtrl: ViewController,
  ) {
    super(navCtrl, navParams, true, tabs);
    // window["Instascan"] = Instascan;
    // alert(Instascan);
  }
  titleContent = "扫一扫";
  @AccountScanAddContactPage.willEnter
  initParams() {
    const title = this.navParams.get("title");
    if (title) {
      this.titleContent = title;
    }
  }
  innerHeight = window.innerHeight;
  innerWidth = window.innerWidth;
  @ViewChild("video") video!: ElementRef;
  @AccountScanAddContactPage.willEnter
  @asyncCtrlGenerator.error("扫描异常")
  openCameraMedia() {
    // const scanner = new Instascan.Scanner({
    //   video: this.video.nativeElement,
    //   mirror: false,
    //   captureImage: true,
    // });
    // return Instascan.Camera.getCameras().then(function(cameras) {
    //   if (cameras.length > 0) {
    //     console.log(cameras);
    //     return scanner.start(cameras[0]);
    //   } else {
    //     console.error("No cameras found.");
    //   }
    // });
    /**/
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const video = this.video.nativeElement;
      // Not adding `{ audio: true }` since we only want video now
      navigator.mediaDevices
        .getUserMedia({
          video: {
            width: this.innerWidth,
            height: this.innerHeight,
            facingMode: "environment",
          },
          audio: false,
        })
        .then(function(stream) {
          video.src = window.URL.createObjectURL(stream);
          video.play();
        })
        .catch(err => {
          console.log("qaq", err);
        });
    }
    /**/
    // return this.qrScanner.prepare().then((status: QRScannerStatus) => {
    //   if (status.authorized) {
    //     // camera permission was granted

    //     // start scanning
    //     let scanSub = this.qrScanner.scan().subscribe((text: string) => {
    //       alert("Scanned something："+ text);

    //       this.qrScanner.hide(); // hide camera preview
    //       scanSub.unsubscribe(); // stop scanning
    //       const mode = this.navParams.get("mode");
    //       if (mode === "scan-only") {
    //         this.jobRes(text);
    //         this.finishJob();
    //       } else {
    //         this.searchContacts();
    //       }
    //       this.qrScanner.hide(); // hide camera preview
    //       scanSub.unsubscribe(); // stop scanning
    //     });

    //     this.qrScanner.resumePreview();
    //     // show camera preview
    //     this.qrScanner.show().then(
    //       (data: QRScannerStatus) => {
    //         alert(data.showing);
    //       },
    //       err => {
    //         alert(err);
    //       },
    //     );

    //     // wait for user to scan something, then the observable callback will be called
    //   } else if (status.denied) {
    //     alert("zzzzz");
    //     this.qrScanner.openSettings();
    //     // camera permission was permanently denied
    //     // you must use QRScanner.openSettings() method to guide the user to the settings page
    //     // then they can grant the permission from there
    //   } else {
    //     alert("qaqqqq");
    //     // permission was denied, but not permanently. You can ask for permission again at a later time.
    //     this.finishJob();
    //   }
    // });
  }

  private _ti;
  searchContacts() {
    return this.getUserPassword()
      .then(pwdData => {
        const { password, pay_pwd } = pwdData;
        this._searchContacts(password, pay_pwd);
      })
      .catch(() => {
        /*密码设置异常不做处理*/
      });
  }

  @asyncCtrlGenerator.error(() =>
    AccountScanAddContactPage.getTranslate("ADD_CONTACT_ERROR"),
  )
  @asyncCtrlGenerator.success(() =>
    AccountScanAddContactPage.getTranslate("ADD_CONTACT_SUCCESS"),
  )
  private async _searchContacts(password, pay_pwd) {
    // 直接添加，暂时不支持搜索
    const address = this.formData.search_text;
    const is_success = await this.contactService.addContact(
      password,
      address,
      pay_pwd,
    );
    this.finishJob();
  }
}
