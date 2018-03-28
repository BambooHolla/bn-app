import { Component, ViewChild, OnInit, Renderer2 } from "@angular/core";
import { SplashScreen } from "@ionic-native/splash-screen";
import { Clipboard } from "@ionic-native/clipboard";
import { StatusBar } from "@ionic-native/status-bar";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Keyboard } from "@ionic-native/keyboard";
import { Toast } from "@ionic-native/toast";
import { FingerprintAIO } from "./native/fingerprint-aio";

import {
  Config,
  Nav,
  Platform,
  ActionSheetController,
  AlertController,
  LoadingController,
  ToastController,
  ModalController,
} from "ionic-angular";

import { AndroidPermissions } from "@ionic-native/android-permissions";
import { FirstRunPage, LoginPage, MainPage } from "../pages/pages";
import { AccountServiceProvider } from "../providers/account-service/account-service";
import { AppSettingProvider } from "../providers/app-setting/app-setting";
import { MinServiceProvider } from "../providers/min-service/min-service";
import { LoginServiceProvider } from "../providers/login-service/login-service";
import { BenefitServiceProvider } from "../providers/benefit-service/benefit-service";
import { UserInfoProvider } from "../providers/user-info/user-info";
import { PromiseOut } from "../bnqkl-framework/PromiseExtends";

import { CommonTransition } from "./common.transition";
import {
  CustomDialogPopIn,
  CustomDialogPopOut,
} from "../pages/custom-dialog/custom-dialog.transform";

if (
  window["cordova"] &&
  window["cordova"].plugins &&
  window["cordova"].plugins.iosrtc
) {
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
    (navigator as any)["mediaDevices"] = window["cordova"].plugins.iosrtc;
  }
}

@Component({
  template: `<ion-nav #content></ion-nav>`, // [root]="rootPage"
})
export class MyApp implements OnInit {
  static WINDOW_MAX_HEIGHT = 0;
  constructor(
    public r2: Renderer2,
    public translate: TranslateService,
    public platform: Platform,
    public config: Config,
    public clipboard: Clipboard,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen,
    public benefitService: BenefitServiceProvider,
    public accountService: AccountServiceProvider,
    public loginService: LoginServiceProvider,
    public appSetting: AppSettingProvider,
    public minService: MinServiceProvider,
    public storage: Storage,
    public keyboard: Keyboard,
    public toast: Toast,
    public actionSheetCtrl: ActionSheetController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public toastCtrl: ToastController,
    public modalController: ModalController,
    public userInfo: UserInfoProvider,
    public faio: FingerprintAIO,
    public androidPermissions: AndroidPermissions,
  ) {
    window["ac"] = this;
    window["clipboard"] = clipboard;
    window["translate"] = translate;
    window["platform"] = platform;
    window["alertCtrl"] = alertCtrl;
    window["loadingCtrl"] = loadingCtrl;
    window["toastCtrl"] = toastCtrl;
    window["toast"] = toast;
    window["actionSheetCtrl"] = actionSheetCtrl;
    window["modalCtrl"] = modalController;
    window["accountService"] = accountService;
    window["benefitService"] = benefitService;
    window["userInfo"] = userInfo;
    window["appSetting"] = appSetting;
    window["minService"] = minService;
    window["myapp"] = this;
    config.setTransition("common-transition", CommonTransition);
    config.setTransition("custom-dialog-pop-in", CustomDialogPopIn);
    config.setTransition("custom-dialog-pop-out", CustomDialogPopOut);
    this.androidPermissions.PERMISSION.USE_FINGERPRINT ||
      (this.androidPermissions.PERMISSION.USE_FINGERPRINT =
        "android.permission.USE_FINGERPRINT");

    let _cur_show_enter_faio: Promise<any> | undefined;
    document.addEventListener("Resume", async () => {
      if (_cur_show_enter_faio) {
        return;
      }
      if (this.currentPage === MainPage) {
        _cur_show_enter_faio = this.showEnterFAIO();
        await _cur_show_enter_faio;
        _cur_show_enter_faio = undefined;
      }
    });

    this.initTranslate();

    const initPage = (async () => {
      if (!localStorage.getItem("HIDE_WELCOME")) {
        await this.openPage(FirstRunPage);
        return null;
      }
      const user_token = appSetting.getUserToken();
      if (user_token && user_token.password) {
        // 自动登录
        await this.loginService.doLogin(user_token.password, true);
        return null;
      }
      return LoginPage;
    })().catch(err => {
      console.error("get init page error:", err);
      return LoginPage;
    });

    // this.openPage(LoginPage);

    this.overlaysWebView();
    statusBar.hide();
    platform.ready().then(() => {
      keyboard.disableScroll(true);
      keyboard.hideKeyboardAccessoryBar(true);
      statusBar.show();
      this.overlaysWebView();
      initPage
        .then(page => {
          if (page) {
            return this.openPage(page);
          }
        })
        .catch(err => {
          console.warn("INIT PAGE ERRROR", err);
          return this.openPage(LoginPage);
        })
        .then(() => {
          loginService.loginStatus.subscribe(isLogined => {
            console.log("isLogined", isLogined);
            this.openPage(isLogined ? MainPage : LoginPage);
          });
        });
    });
  }
  overlaysWebView() {
    this.statusBar.overlaysWebView(false);
    setTimeout(() => {
      this.statusBar.overlaysWebView(true);
      this.statusBar.styleDefault();
    }, 50);
  }
  _isIOS?: boolean;
  get isIOS() {
    if (this._isIOS === undefined) {
      this._isIOS = this.platform.is("ios");
    }
    return this._isIOS;
  }
  tryOverlaysWebView(loop_times: number = 0) {
    if (this.isIOS) {
      return;
    }
    if (window.innerHeight < MyApp.WINDOW_MAX_HEIGHT) {
      // 如果高度不对劲的话，尽可能重新搞一下
      this.overlaysWebView();
    }
    if (loop_times > 0) {
      // 等一下再看看是否修正正确了，不行就再来一次
      setTimeout(() => {
        this.tryOverlaysWebView(loop_times - 1);
      }, 500);
    }
  }

  initTranslate() {
    // Set the default language for translation strings, and the current language.
    this.translate.setDefaultLang("en");
    if (this.appSetting.settings.lang) {
      return this.translate.use(this.appSetting.settings.lang);
    }
    const browserLang = this.translate.getBrowserLang();

    if (browserLang) {
      if (browserLang === "zh") {
        const browserCultureLang = this.translate.getBrowserCultureLang();
        if (browserCultureLang.match(/-TW|CHT|Hant/i)) {
          this.translate.use("zh-cmn-Hant");
        } else {
          this.translate.use("zh-cmn-Hans");
        }
      } else {
        const langs = this.translate.getLangs();
        const current_lang = this.translate.getBrowserLang();
        if (langs.indexOf(current_lang) !== -1) {
          this.translate.use(current_lang);
        } else {
          const maybe_lang =
            langs.find(lang => current_lang.startsWith(lang)) || "en";
          this.translate.use(maybe_lang);
        }
      }
    } else {
      this.translate.use("en"); // Set your language here
    }

    // this.translate.get(["BACK_BUTTON_TEXT"]).subscribe(values => {
    //   this.config.set("ios", "backButtonText", values.BACK_BUTTON_TEXT);
    // });
  }

  @ViewChild(Nav) nav?: Nav;
  private _onNavInitedPromise = new PromiseOut();
  ngOnInit() {
    this._onNavInitedPromise.resolve(this.nav);
  }

  currentPage: any;
  _currentOpeningPage: any; // 前置对象 锁
  tryInPage: any;
  async openPage(page: string, force = false) {
    this.tryInPage = page;
    if (!force) {
      if (this.currentPage == FirstRunPage) {
        return;
      }
    }
    return this._openPage(page);
  }
  private async _openPage(page: string) {
    if (this.currentPage === page || this._currentOpeningPage === page) {
      return;
    }
    try {
      this._currentOpeningPage = page;
      console.log(
        `%c Open Page:[${page}] and set as root`,
        "font-size:1.2rem;color:yellow;",
      );
      if (page === MainPage) {
        if (!await this.showEnterFAIO()) {
          return;
        }
      }
      this.currentPage = page;
      if (this.nav) {
        return this.nav.setRoot(page);
      } else {
        return this._onNavInitedPromise.promise.then(() => {
          return this.nav && this.nav.setRoot(page);
        });
      }
    } finally {
      // 还原临时对象
      this._currentOpeningPage = this.currentPage;
    }
  }
  private _is_hide = false;
  hideSplashScreen() {
    if (this._is_hide) {
      return;
    }
    this.splashScreen.hide();
    this._is_hide = true;
  }
  /*Android会返回OK，IOS会返回finger或者face*/
  faio_support_info = this.faio.isAvailable().catch(err => {
    console.warn("不支持指纹识别");
    return false;
  });

  has_finger_permission = false;
  isAndroid = this.platform.is("android");
  async showEnterFAIO() {
    if (
      this.appSetting.settings.open_fingerprint_protection &&
      this.userInfo.address
    ) {
      if (!this.has_finger_permission && this.isAndroid) {
        // 获取Android权限
        const permission = await this.androidPermissions
          .checkPermission(this.androidPermissions.PERMISSION.USE_FINGERPRINT)
          .then(
            result => {
              console.log("Has permission?", result.hasPermission);
              if (!result.hasPermission) {
                return this.androidPermissions.requestPermission(
                  this.androidPermissions.PERMISSION.USE_FINGERPRINT,
                );
              }
              return result;
            },
            err =>
              this.androidPermissions.requestPermission(
                this.androidPermissions.PERMISSION.USE_FINGERPRINT,
              ),
          );
        this.has_finger_permission = permission && permission.hasPermission;
      }

      const support_info = await this.faio_support_info;
      try {
        this.r2.setStyle(document.body, "filter", "blur(20px)");
        const res = await this.faio.show({
          clientId: this.userInfo.address + "@LOGIN",
          clientSecret: this.userInfo.address,
          disableCancel: true,
          disableBackup: true, // 禁用手势密码
          localizedReason:
            support_info === "face" ? "账户信息保护校验" : "账户信息保护校验",
          fingerprint_auth_dialog_title: "账户信息保护校验",
        });
        if (res.withPassword === true) {
          // 使用手势密码解锁了
        }
        console.log("faio:", res);
        return res;
      } catch (err) {
        console.error(err);
        return false;
        // if (err === "Cancelled") {
        //   return this.showEnterFAIO(); // 再次调用，
        // }
      } finally {
        this.r2.setStyle(document.body, "filter", null);
      }
    }
  }
}

/*获取window正确的最大高度，可能对于分屏支持有问题*/
var resizeInfo = document.createElement("div");
function onresize() {
  if (!resizeInfo.parentElement && document.body) {
    resizeInfo.style.cssText =
      "display:none;position:fixed;top:100px;left:100px;background:rgba(0,0,0,0.5);color:#FFF;opacity:0.3;pointer-events:none;";
    document.body.appendChild(resizeInfo);
  }
  resizeInfo.innerHTML += `<p>${[
    window.innerHeight,
    document.body.clientHeight,
  ]}</p>`;
  MyApp.WINDOW_MAX_HEIGHT = Math.max(
    MyApp.WINDOW_MAX_HEIGHT,
    window.innerHeight,
  );
}
onresize();
window.addEventListener("resize", onresize);
