import { Component, ViewChild, OnInit } from "@angular/core";
import { SplashScreen } from "@ionic-native/splash-screen";
import { StatusBar } from "@ionic-native/status-bar";
import { TranslateService } from "@ngx-translate/core";
import {
  Config,
  Nav,
  Platform,
  AlertController,
  LoadingController,
  ToastController,
  ModalController,
} from "ionic-angular";

import { Storage } from "@ionic/storage";
import { Keyboard } from "@ionic-native/keyboard";
import { Toast } from "@ionic-native/toast";

import { FirstRunPage, LoginPage, MainPage } from "../pages/pages";
import { SettingsProvider } from "../providers/settings/settings";
import { AccountServiceProvider } from "../providers/account-service/account-service";
import { LoginServiceProvider } from "../providers/login-service/login-service";
import { PromiseOut } from "../bnqkl-framework/PromiseExtends";

@Component({
  template: `<ion-nav #content></ion-nav>`, // [root]="rootPage"
})
export class MyApp implements OnInit {
  constructor(
    public translate: TranslateService,
    public platform: Platform,
    public settings: SettingsProvider,
    public config: Config,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen,
    public accountService: AccountServiceProvider,
    public loginService: LoginServiceProvider,
    public storage: Storage,
    public keyboard: Keyboard,
    public toast: Toast,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public toastCtrl: ToastController,
    public modalController: ModalController,
  ) {
    window["translate"] = translate;
    window["platform"] = platform;
    window["alertCtrl"] = alertCtrl;
    window["loadingCtrl"] = loadingCtrl;
    window["toastCtrl"] = toastCtrl;
    window["toast"] = toast;
    window["modalCtrl"] = modalController;
    window["accountService"] = accountService;
    window["myapp"] = this;
    statusBar.hide();
    platform.ready().then(() => {
      statusBar.show();
      keyboard.disableScroll(true);
      keyboard.hideKeyboardAccessoryBar(true);
      statusBar.styleDefault();
      statusBar.overlaysWebView(true);
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      // this.statusBar.styleDefault();
      statusBar.styleBlackTranslucent();
      statusBar.overlaysWebView(true);
      statusBar.hide();
      splashScreen.hide();
    });
    this.initTranslate();
    if (!localStorage.getItem("HIDE_WELCOME")) {
      localStorage.setItem("HIDE_WELCOME", "1");
      this.openPage(FirstRunPage);
    }

    loginService.loginStatus.subscribe(isLogined => {
      console.log("isLogined", isLogined);
      this.openPage(isLogined ? MainPage : MainPage);
    });
  }

  initTranslate() {
    // Set the default language for translation strings, and the current language.
    this.translate.setDefaultLang("en");
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
        this.translate.use(this.translate.getBrowserLang());
      }
    } else {
      this.translate.use("en"); // Set your language here
    }

    // this.translate.get(["BACK_BUTTON_TEXT"]).subscribe(values => {
    //   this.config.set("ios", "backButtonText", values.BACK_BUTTON_TEXT);
    // });
  }

  @ViewChild(Nav) nav: Nav;
  private _onNavInitedPromise = new PromiseOut();
  ngOnInit() {
    this._onNavInitedPromise.resolve(this.nav);
  }

  currentPage: any;
  tryInPage: any;
  openPage(page: string, force = false) {
    this.tryInPage = page;
    if (!force) {
      if (this.currentPage == FirstRunPage) {
        return;
      }
    }
    this._openPage(page);
  }
  private _openPage(page: string) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    if (this.nav) {
      this.nav.setRoot(page);
      this.currentPage = page;
    } else {
      this._onNavInitedPromise.promise.then(() => {
        this.nav.setRoot(page);
        this.currentPage = page;
      });
    }
  }
}
