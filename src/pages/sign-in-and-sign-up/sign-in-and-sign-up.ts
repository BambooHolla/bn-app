import { Component, ViewChild, ElementRef, OnInit } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { EarthNetMeshComponent } from "../../components/earth-net-mesh/earth-net-mesh";
import { ChainMeshComponent } from "../../components/chain-mesh/chain-mesh";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { LoginServiceProvider } from "../../providers/login-service/login-service";
import { BlockServiceProvider } from "../../providers/block-service/block-service";
import { TransactionServiceProvider } from "../../providers/transaction-service/transaction-service";
import { AccountServiceProvider } from "../../providers/account-service/account-service";
import { asyncCtrlGenerator } from '../../bnqkl-framework/Decorator';
import { MyApp } from '../../app/app.component';
import {
  LoginFormInOut,
  RegisterFormInOut,
} from "./sign-in-and-sign-up.animations";
import { MainPage } from '../pages';
import { AppSettingProvider } from "../../providers/app-setting/app-setting";

@IonicPage({ name: "sign-in-and-sign-up" })
@Component({
  selector: "page-sign-in-and-sign-up",
  templateUrl: "sign-in-and-sign-up.html",
  animations: [LoginFormInOut, RegisterFormInOut],
})
export class SignInAndSignUpPage extends FirstLevelPage implements OnInit {
  ifmJs = AppSettingProvider.IFMJS
  transactionType = this.ifmJs.transactionTypes
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public loginService: LoginServiceProvider,
    public myApp: MyApp,
    public blockService: BlockServiceProvider,
    public transactionService: TransactionServiceProvider,
  ) {
    super(navCtrl, navParams);
  }
  @ViewChild(EarthNetMeshComponent) earth: EarthNetMeshComponent;
  @ViewChild(ChainMeshComponent) cmesh: ChainMeshComponent;

  @SignInAndSignUpPage.didEnter
  initEarchPos() {
    if (this.earth) {
      this.earth.camera.position.y = 18 * this.earth.devicePixelRatio;
      this.earth.camera.position.z /= 1.8;
      this.earth.line_width = 1.5;
    }
    if (this.cmesh) {
      // this.cmesh.startAnimation();
    }
  }

  formData = {
    email: "",
    phone: "",
    remark: "",
    pwd: "",
    pwd_disc: "",
  };
  _ture_pwd = "";
  pwd_textarea_height = "";

  autoReHeightPWDTextArea(e) {
    // e.target.style.height
    this.pwd_textarea_height = e.target.style.height = "";
    if (e.target.clientHeight < e.target.scrollHeight) {
      this.pwd_textarea_height = e.target.style.height =
        e.target.scrollHeight + "px";
    }
  }
  bindFormData(e) {
    debugger;
    var content = e.target.innerHTML
      .replace(/\<span\sclass\=\"dot\"\>([\w\W]+?)\<\/span\>/g, "$1")
      .replace(/\&nbsp\;/g, " ");
    this.formData.pwd = content;
    requestAnimationFrame(() => {
      this.hiddenPwd();
    });
  }

  show_pwd = false;
  showPWD() {
    this.show_pwd = true;
  }
  hidePWD() {
    this.show_pwd = false;
  }
  hiddenPwd() {
    this.formData.pwd_disc = this.formData.pwd.replace(
      /([\w\W])/g,
      (match_str, match_char) => {
        return `<span class="dot">${
          match_char === " " ? "&nbsp;" : match_char
          }</span>`;
      },
    );
  }

  page_status = "login";
  gotoLogin() {
    this.page_status = "login";
    this.earth && this.earth.rotateMeshsZ(0, 500, -1);
  }

  get canDoLogin() {
    return this.formData.pwd;
  }
  @asyncCtrlGenerator.error(() =>
    SignInAndSignUpPage.getTranslate("LOGIN ERROR"),
  )
  @asyncCtrlGenerator.loading()
  async doLogin() {
    let result = await this.loginService.doLogin(this.formData.pwd);
    if (result) {
      this.routeTo("scan-nodes");
    }
  }
  gotoRegister() {
    this.page_status = "register";
    this.earth && this.earth.rotateMeshsZ(Math.PI, 500, -1);
  }
  get canDoRegister() {
    return this.allHaveValues(this.formData);
  }

  async doRegister() {
    let txData = {
      // "typeName" : "SEND",
      "type": this.transactionType.SEND,
      "amount": "0.00000001",
      "secret": "decorate soap volcano lizard original leaf evolve vibrant protect maple enough together weapon erase orphan eye blue spoil verb more credit garbage barrel age",
      "publicKey": "38e70075fc1054bfbb29cb550932a719f88c1c34f2ed897f1ae74a328ab9a21e",
      "recipientId": "c2B5D921U9sbLfQCBAWhyFMnJcHEcc3ij2",
      "fee": "0.00000001"
    }
    this.transactionService.putTransaction(txData);
    let a = await this.blockService.getLastBlock();
    this.blockService.getTopBlocks(true);
    let passphrase = this.loginService.generateNewPassphrase();
    console.log(passphrase);
  }

  ngOnInit() {
    console.log('------------------------------------');
    // console.log(this.loginService.getRecentAccount());
    // console.log(this.blockService.getBlockById('05963d5f2b543b2aae053498633b43fb244b1f9c99918e6bb05bd705b3a5427c'));
    // console.log(this.blockService.getLastBlock());
    // console.log(this.blockService.getBlocks());
    // console.log(this.blockService.getTopBlocks(true));
    console.log('---------------------------------------');
  }
}
