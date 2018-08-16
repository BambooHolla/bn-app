import { Component, ViewChild, ElementRef, OnInit } from "@angular/core";
import { DomSanitizer, SafeStyle } from "@angular/platform-browser";

import { IonicPage, NavController, NavParams } from "ionic-angular";
import { ChainMeshComponent } from "../../components/chain-mesh/chain-mesh";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { LoginServiceProvider } from "../../providers/login-service/login-service";
import { BlockServiceProvider } from "../../providers/block-service/block-service";
import {
  TransactionServiceProvider,
  TransactionTypes,
} from "../../providers/transaction-service/transaction-service";
import { AccountServiceProvider } from "../../providers/account-service/account-service";
import { PeerServiceProvider } from "../../providers/peer-service/peer-service";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { tryRegisterGlobal } from "../../bnqkl-framework/FLP_Tool";
import { MyApp } from "../../app/app.component";
// import {
//   LoginFormInOut,
//   RegisterFormInOut,
// } from "./sign-in-and-sign-up.animations";
import { MainPage } from "../pages";
import { AppSettingProvider } from "../../providers/app-setting/app-setting";
import { SocialSharing } from "@ionic-native/social-sharing";

// @IonicPage({ name: "sign-in-and-sign-up" })
@Component({
  selector: "page-sign-in-and-sign-up",
  templateUrl: "sign-in-and-sign-up.html",
  // animations: [LoginFormInOut, RegisterFormInOut],
})
export class SignInAndSignUpPage extends FirstLevelPage {
  ifmJs = AppSettingProvider.IFMJS;
  TransactionTypes = TransactionTypes;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public loginService: LoginServiceProvider,
    public myapp: MyApp,
    public blockService: BlockServiceProvider,
    public transactionService: TransactionServiceProvider,
    public domSanitizer: DomSanitizer,
    public socialSharing: SocialSharing,
    public peerService: PeerServiceProvider
  ) {
    super(navCtrl, navParams);
  }

  get app_version() {
    return AppSettingProvider.APP_VERSION;
  }
  // @SignInAndSignUpPage.willEnter
  // fixStaturBug() {
  //   this.myapp.tryOverlaysWebView();
  // }

  @ViewChild("passwordTextarear") passwordTextarear?: ElementRef;
  @ViewChild(ChainMeshComponent) cmesh?: ChainMeshComponent;

  @SignInAndSignUpPage.didEnter
  initEarchPos() {
    if (this.cmesh) {
      // this.cmesh.startAnimation();
    }
  }

  get lang_code() {
    return this.translate.currentLang;
  }

  formData = {
    email: "",
    phone: "",
    remark: "",
    gpwd: "",
    pwd: "",
    remember_pwd: true,
  };
  is_agree_user_agreement = false;
  pwd_by_register = "";
  _ture_pwd = "";
  pwd_textarea_height = "";

  autoReHeightPWDTextArea(stop_loop?: boolean) {
    if (!stop_loop) {
      this.raf(() => {
        this.autoReHeightPWDTextArea(true);
      });
    }
    if (this.passwordTextarear) {
      const ele = this.passwordTextarear.nativeElement;
      this.pwd_textarea_height = ele.style.height = "";
      if (ele.clientHeight < ele.scrollHeight) {
        this.pwd_textarea_height = ele.style.height = ele.scrollHeight + "px";
      }
    }
  }

  show_pwd = false;
  showPWD() {
    this.show_pwd = true;
  }
  hidePWD() {
    this.show_pwd = false;
  }
  togglePWD() {
    this.show_pwd = !this.show_pwd;
    this.raf(() => {
      this.autoReHeightPWDTextArea();
    });
  }

  font_name: SafeStyle = this.domSanitizer.bypassSecurityTrustStyle("PWD");
  @ViewChild("fontCalc") fontCalcEle?: ElementRef;
  calcFontWidth(c): number {
    if (this.fontCalcEle) {
      const ele = this.fontCalcEle.nativeElement;
      ele.innerHTML = c;
      return ele.getBoundingClientRect().width;
    }
    return 0;
  }

  page_status = "login";
  gotoLogin() {
    this.page_status = "login";
  }

  get canDoLogin() {
    return this.formData.pwd;
  }
  @asyncCtrlGenerator.error(() =>
    SignInAndSignUpPage.getTranslate("LOGIN_ERROR")
  )
  // @asyncCtrlGenerator.loading("@@LOGINNG")
  async doLogin() {
    if (!this.is_agree_user_agreement) {
      this.openUserAgreementPage();
      return;
    }
    if (this.formData.pwd.length < 24) {
      const res = await this.waitTipDialogConfirm("@@PWD_TOO_SHORT_TIP", {
        true_text: "@@GO_GENERATOR_NEW_PWD",
        false_text: "@@KEEP_USE_SHORT_PWD",
      });
      if (res) {
        this.gotoRegister();
        return;
      }
    }
    if (
      this.pwd_by_register === this.formData.pwd &&
      (await this.waitTipDialogConfirm("@@LOGIN_PWD_TIP", {
        true_text: "@@SAVE_NOW",
        false_text: "@@ALREADY_SAVED",
      }))
    ) {
      return await this.copyAndShare();
    }
    const result = await this.loginService.doLogin(
      this.formData.pwd.trim(),
      this.formData.remember_pwd
    );
    if (result) {
      // this.routeTo("scan-nodes");
      await this.myapp.openPage(MainPage, undefined, null /*"@@LOGINNG"*/);
    }
  }
  gotoRegister() {
    this.page_status = "register";
  }
  get canDoRegister() {
    return true; //this.allHaveValues(this.formData);
  }
  @asyncCtrlGenerator.single()
  async doRegister() {
    // // let peers = await this.peerService.getAllPeers();
    // let sortPeer = await this.peerService.sortPeers();
    // // console.log(peers);
    // console.log(sortPeer);
    const params = {
      email: this.formData.email,
      phone: this.formData.phone,
      mark: this.formData.remark,
      pwd: this.formData.gpwd,
    };
    for (var key in params) {
      if (!params[key]) {
        delete params[key];
      }
    }
    let passphrase = this.loginService.generateNewPassphrase(params);
    this.gotoLogin();
    // 不自动填充。放入到剪切板中
    // this.formData.pwd = passphrase;
    // this.show_pwd = true;
    this.pwd_by_register = passphrase;

    this.platform.raf(() => {
      this.autoReHeightPWDTextArea(true);
    });
    if (
      await this.waitTipDialogConfirm("@@RGISTER_PWD_TIP", {
        true_text: "@@COPY_NOW",
        false_text: "@@CANCEL_COPY",
      })
    ) {
      return await this.copyAndShare();
    }
  }

  /*打开用户协议*/
  openUserAgreementPage() {
    const model = this.modalCtrl.create("user-agreement");
    model.onWillDismiss(data => {
      this.is_agree_user_agreement = data;
    });
    model.present();
  }

  async copyAndShare() {
    await this.navigatorClipboard.writeText(this.pwd_by_register);
    await this.showToast(
      this.getTranslateSync("YOUR_PASSWORD_HAS_BEEN_SAVED_TO_THE_CLIPBOARD"),
      2000
    );
    return this.socialSharing.share(this.pwd_by_register);
  }
}
