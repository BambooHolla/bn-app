import { BarcodeScanner } from "@ionic-native/barcode-scanner";
import { AndroidPermissions } from "@ionic-native/android-permissions";
import { ViewChild, ElementRef, Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { PAGE_STATUS } from "../../../bnqkl-framework/const";
import { TabsPage } from "../../tabs/tabs";
import "../../../llqrcode";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
  AlertOptions,
} from "ionic-angular";
// import * as Instascan from "instascan";
// window["Instascan"] = Instascan;
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
    public contactService: ContactServiceProvider,
    public viewCtrl: ViewController,
    public androidPermissions: AndroidPermissions,
    public barcodeScanner: BarcodeScanner,
  ) {
    super(navCtrl, navParams, true, tabs);
    // window["Instascan"] = Instascan;
    // alert(Instascan);
  }
  titleContent = "SCAN-QR-CODE";
  @AccountScanAddContactPage.willEnter
  initParams() {
    const title = this.navParams.get("title");
    if (title) {
      this.titleContent = title;
    }
  }
  private _current_stream?: MediaStream;
  videoDevices: MediaDeviceInfo[] = [];
  private _cur_video_device?: MediaDeviceInfo;

  useNextVideoDevice() {
    const index =
      (this.videoDevices.indexOf(this._cur_video_device as any) + 1) %
      this.videoDevices.length;
    return this.useVideoDevice(this.videoDevices[index]);
  }
  async useVideoDevice(videoDevice: MediaDeviceInfo) {
    if (this._cur_video_device == videoDevice) {
      return;
    }
    this._cur_video_device = videoDevice;
    const video = this.video.nativeElement as HTMLVideoElement;
    // for(let i =0;i<video.videoTracks.length;i+=1){
    //   const videoTrack = video.videoTracks[i];
    // }
    const stream = (this._current_stream = await navigator.mediaDevices.getUserMedia(
      {
        video: {
          width: this.innerWidth,
          height: this.innerHeight,
          deviceId: videoDevice.deviceId,
        },
        audio: false,
      },
    ));
    video.src = window.URL.createObjectURL(stream);
    video.play();
  }
  /**相机获取插件是否初始化完毕 */
  is_inited = false;
  innerHeight = window.innerHeight;
  innerWidth = window.innerWidth;
  @ViewChild("video") video!: ElementRef;
  @ViewChild("canvas") canvas!: ElementRef;
  @AccountScanAddContactPage.willEnter
  @asyncCtrlGenerator.error(() =>
    AccountScanAddContactPage.getTranslate("SCAN_ERROR"),
  )
  async openCameraMedia() {
    this.is_inited = false;
    try {
      const image_url = this.navParams.get("image_url");
      if (image_url) {
        return;
      }
      // 媒体流实时解析模式
      var filter_fun = this.navParams.get("filter");
      if (!(filter_fun instanceof Function)) {
        filter_fun = () => true;
      }
      var res = "";
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        // IOS 不用检测权限
      } else {
        const permission = await this.androidPermissions
          .checkPermission(this.androidPermissions.PERMISSION.CAMERA)
          .then(
            result => {
              console.log("Has permission?", result.hasPermission);
              if (!result.hasPermission) {
                return this.androidPermissions.requestPermission(
                  this.androidPermissions.PERMISSION.CAMERA,
                );
              }
            },
            err =>
              this.androidPermissions.requestPermission(
                this.androidPermissions.PERMISSION.CAMERA,
              ),
          );
        // this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CAMERA);
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.videoDevices = devices
          .filter(d => d.kind === "videoinput")
          .reverse();
        // Not adding `{ audio: true }` since we only want video now

        this.useVideoDevice(this.videoDevices[0]);
        res = await new Promise<string>(resolve =>
          this.startCapture(text => {
            if (filter_fun(text)) {
              resolve(text);
              return true;
            }
            return false;
          }),
        );
      } else {
        this.is_inited = true;
        res = (await this.barcodeScanner.scan()).text;
      }
      this._handleScanRes(res);
    } finally {
      this.is_inited = true;
    }
  }
  @AccountScanAddContactPage.willEnter
  @asyncCtrlGenerator.error(
    () => AccountScanAddContactPage.getTranslate("SCAN_ERROR"),
    async function(self: AccountScanAddContactPage) {
      return {
        buttons: [
          {
            text: await self.getTranslate("OK"),
            handler() {
              self.finishJob();
            },
          },
        ],
      } as AlertOptions;
    },
  )
  async parseSingleImage() {
    const image_url = this.navParams.get("image_url");
    if (!image_url) {
      return;
    }
    // 单张图片解析模式
    var filter_fun = this.navParams.get("filter");
    if (!(filter_fun instanceof Function)) {
      filter_fun = () => true;
    }
    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    window["qrcode"].canvas_qr2 = canvas;
    window["qrcode"].qrcontext2 = ctx;
    const image = await new Promise<HTMLImageElement>((reslove, reject) => {
      const img = new Image();
      img.src = image_url;

      img.onload = () => {
        reslove(img);
      };
      img.onerror = reject;
    });
    var res = this._scanQrcodeFrame(image, true, filter_fun);
    this.full_view_canvas = true;
    if (!res) {
      throw new Error(await this.getTranslate("QRCODE_PICTURE_PARSE_ERROR"));
    }
    this._handleScanRes(res);
  }
  /**是否看到完整的canvas*/
  full_view_canvas = false;
  private _handleScanRes(res: string) {
    const mode = this.navParams.get("mode");
    if (mode === "try-to-add-contact") {
      const m = this.modalCtrl.create("account-add-contact", {
        address: res,
        auto_search: true,
        showCloseButton: true,
      });
      m.present();
      m.onDidDismiss(() => {
        this.finishJob();
      });
    } else {
      this.jobRes(res);
      this.finishJob();
    }
  }
  result_str = "";
  startCapture(cb: (res: string) => boolean) {
    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    const video = this.video.nativeElement as HTMLVideoElement;
    if (video.videoHeight * video.videoWidth == 0) {
      if (this.PAGE_STATUS <= PAGE_STATUS.DID_ENTER) {
        requestAnimationFrame(() => this.startCapture(cb));
      }
      return;
    }
    this.is_inited = true;
    // canvas.style.top = (video.height - video.videoHeight) / 2 + 'px';
    // canvas.style.left = (video.width - video.videoWidth) / 2 + 'px';
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    window["qrcode"].canvas_qr2 = canvas;
    window["qrcode"].qrcontext2 = ctx;
    // window['qrcode'].debug = true
    const check_interval = 200;
    var pre_time = 0;
    const scanQrCode = (time: number) => {
      if (this.PAGE_STATUS <= PAGE_STATUS.DID_ENTER) {
        const diff_t = time - pre_time;
        if (diff_t > check_interval) {
          pre_time = time;
          this._scanQrcodeFrame(video, false, cb);
        }
        requestAnimationFrame(scanQrCode);
      }
    };
    scanQrCode(performance.now());
  }
  private _scanQrcodeFrame(
    source: HTMLVideoElement | HTMLImageElement,
    auto_size: boolean,
    filter?: (res: string) => boolean,
  ) {
    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    var source_width = source.width;
    var source_height = source.height;
    if (source_width > canvas.width) {
      source_height *= canvas.width / source_width;
      source_width = canvas.width;
    }
    if (source_height > canvas.height) {
      source_width *= canvas.height / source_height;
      source_height = canvas.height;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (auto_size) {
      ctx.drawImage(
        source,
        (canvas.width - source_width) / 2,
        (canvas.height - source_height) / 2,
        source_width,
        source_height,
      );
    } else {
      ctx.drawImage(source, 0, 0);
    }

    try {
      const res = window["qrcode"].decode();

      const points = window["qrcode"].result_points;
      if (points instanceof Array) {
        for (let point of points) {
          ctx.fillStyle = "rgba(0, 188, 212, 1)";
          ctx.beginPath();
          ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
          ctx.closePath();
          ctx.fill();
        }
      }

      this.result_str = res;
      if (filter && filter(res)) {
        return res;
      }
      return res;
    } catch (err) {
      // this.result_str = err.toString();
    }
  }

  @AccountScanAddContactPage.didLeave
  stopCameraMedia() {
    const video = this.video.nativeElement as HTMLVideoElement;
    video.pause();
    if (this._current_stream) {
      if (this._current_stream.stop instanceof Function) {
        this._current_stream.stop();
      }
      this._current_stream.getVideoTracks().forEach(track => track.stop());
    }
    window.URL.revokeObjectURL(video.src);
    video.src = "";
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
