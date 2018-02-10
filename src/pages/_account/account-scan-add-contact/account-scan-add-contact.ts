import { AndroidPermissions } from '@ionic-native/android-permissions';
import { ViewChild, ElementRef, Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { PAGE_STATUS } from "../../../bnqkl-framework/const";
import { TabsPage } from "../../tabs/tabs";
import '../../../llqrcode';
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
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
    public androidPermissions: AndroidPermissions
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
  videoDevices: MediaDeviceInfo[] = [];
  private _cur_video_device?: MediaDeviceInfo

  useNextVideoDevice() {
    const index = (this.videoDevices.indexOf(this._cur_video_device as any) + 1) % this.videoDevices.length;
    return this.useVideoDevice(this.videoDevices[index]);
  }
  async useVideoDevice(videoDevice: MediaDeviceInfo) {
    if (this._cur_video_device == videoDevice) {
      return
    }
    this._cur_video_device = videoDevice;
    const video = this.video.nativeElement as HTMLVideoElement;
    // for(let i =0;i<video.videoTracks.length;i+=1){
    //   const videoTrack = video.videoTracks[i];
    // }
    const stream = await navigator.mediaDevices
      .getUserMedia({
        video: {
          width: this.innerWidth,
          height: this.innerHeight,
          deviceId: videoDevice.deviceId,
        },
        audio: false,
      });
    video.src = window.URL.createObjectURL(stream)
    video.play();
  }
  innerHeight = window.innerHeight;
  innerWidth = window.innerWidth;
  @ViewChild("video") video!: ElementRef;
  @ViewChild("canvas") canvas!: ElementRef;
  @AccountScanAddContactPage.willEnter
  @asyncCtrlGenerator.error("扫描异常")
  async openCameraMedia() {
    var filter_fun = this.navParams.get("filter");
    if (!(filter_fun instanceof Function)) {
      filter_fun = () => true
    }
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      // IOS 不用检测权限
    } else {
      const permission = await this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.CAMERA)
        .then(
          result => {
            console.log('Has permission?', result.hasPermission);
            if (!result.hasPermission) {
              return this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CAMERA)
            }
          },
          err => this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CAMERA)
        );
      // this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CAMERA);
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.videoDevices = devices.filter((d) => d.kind === "videoinput").reverse();
      // Not adding `{ audio: true }` since we only want video now

      this.useVideoDevice(this.videoDevices[0]);
      const res = await new Promise(cb => this.startCapture((text => {
        if (filter_fun(text)) {
          cb(text)
          return true;
        }
        return false
      })));
      const mode = this.navParams.get('mode');
      if (mode === 'try-to-add-contact') {
        const m = this.modalCtrl.create("account-add-contact", {
          address: res,
          auto_search: true
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
  }
  result_str = ""
  startCapture(cb: (res: string) => boolean) {
    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    const video = this.video.nativeElement as HTMLVideoElement;
    if (video.videoHeight * video.videoWidth == 0) {
      if (this.PAGE_STATUS <= PAGE_STATUS.DID_ENTER) {
        requestAnimationFrame(() => this.startCapture(cb));
      }
      return
    }
    // canvas.style.top = (video.height - video.videoHeight) / 2 + 'px';
    // canvas.style.left = (video.width - video.videoWidth) / 2 + 'px';
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    window['qrcode'].canvas_qr2 = canvas;
    window['qrcode'].qrcontext2 = ctx;
    // window['qrcode'].debug = true
    const check_interval = 200;
    var pre_time = 0;
    const scanQrCode = (time: number) => {
      if (this.PAGE_STATUS <= PAGE_STATUS.DID_ENTER) {
        const diff_t = time - pre_time;
        if (diff_t > check_interval) {
          pre_time = time;
          ctx.drawImage(video, 0, 0);
          try {
            const res = window['qrcode'].decode();
            this.result_str = res;
            if (cb(res)) {
              return
            }
          } catch (err) {
            // this.result_str = err.toString();
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const points = window['qrcode'].result_points;
          if (points instanceof Array) {
            for (let point of points) {
              ctx.fillStyle = 'rgba(0, 188, 212, 1)';
              ctx.beginPath();
              ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
              ctx.closePath();
              ctx.fill();
            }
          }
        }
        requestAnimationFrame(scanQrCode);
      }
    }
    scanQrCode(performance.now());
  }

  @AccountScanAddContactPage.didLeave
  stopCameraMedia() {
    const video = this.video.nativeElement as HTMLVideoElement;
    video.pause();
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
