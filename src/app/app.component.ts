import { Component, ViewChild, OnInit } from "@angular/core";
import { SplashScreen } from "@ionic-native/splash-screen";
import { Clipboard } from "@ionic-native/clipboard";
import { StatusBar } from "@ionic-native/status-bar";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Keyboard } from "@ionic-native/keyboard";
import { Toast } from "@ionic-native/toast";

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

import { FirstRunPage, LoginPage, MainPage } from "../pages/pages";
import { AccountServiceProvider } from "../providers/account-service/account-service";
import { AppSettingProvider } from "../providers/app-setting/app-setting";
import { MinServiceProvider } from "../providers/min-service/min-service";
import { LoginServiceProvider } from "../providers/login-service/login-service";
import { BenefitServiceProvider } from "../providers/benefit-service/benefit-service";
import { UserInfoProvider } from "../providers/user-info/user-info";
import { PromiseOut } from "../bnqkl-framework/PromiseExtends";

import { CommonTransition } from "./common.transition";

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
  constructor(
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
    if (this.currentPage === page) {
      return;
    }
    console.log(
      `%c Open Page:[${page}] and set as root`,
      "font-size:1.2rem;color:yellow;",
    );
    this.currentPage = page;
    if (this.nav) {
      return this.nav.setRoot(page);
    } else {
      return this._onNavInitedPromise.promise.then(() => {
        return this.nav && this.nav.setRoot(page);
      });
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
}
