import { Component, ViewChild, ElementRef, OnInit } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { EarthNetMeshComponent } from "../../components/earth-net-mesh/earth-net-mesh";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { LoginServiceProvider } from "../../providers/login-service/login-service";
import { BlockServiceProvider } from "../../providers/block-service/block-service";
import { asyncCtrlGenerator} from '../../bnqkl-framework/Decorator';
import { MyApp } from '../../app/app.component';
import { MainPage } from '../pages';

@IonicPage({ name: "sign-in-and-sign-up" })
@Component({
  selector: "page-sign-in-and-sign-up",
  templateUrl: "sign-in-and-sign-up.html",
})
export class SignInAndSignUpPage extends FirstLevelPage implements OnInit {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public loginService: LoginServiceProvider,
    public myApp : MyApp,
    public blockService: BlockServiceProvider,
  ) {
    super(navCtrl, navParams);
  }
  @ViewChild(EarthNetMeshComponent) earth: EarthNetMeshComponent;

  @SignInAndSignUpPage.didEnter
  initEarchPos() {
    this.earth.camera.position.y = 10 * this.earth.devicePixelRatio;
    this.earth.camera.position.z /= 1.6;
  }

  formData = {
    pwd: "",
  };

  autoReHeightPWDTextArea(e) {
    e.target.style.height = "";
    if (e.target.clientHeight < e.target.scrollHeight) {
      e.target.style.height = e.target.scrollHeight + "px";
    }
  }

  show_pwd = false;
  showPWD() {
    this.show_pwd = true;
  }
  hidePWD() {
    this.show_pwd = false;
  }

  page_status = "login";
  gotoLogin() {
    this.page_status = "login";
  }
  @asyncCtrlGenerator.error(()=>SignInAndSignUpPage.getTranslate('LOGIN ERROR'))
  @asyncCtrlGenerator.loading()
  async doLogin() {
    let result = await this.loginService.doLogin(this.formData.pwd);
    if(result) {
      this.myApp.openPage( MainPage );
    }

  }
  gotoRegister() {
    this.page_status = "register";
  }
  doRegister() {
    let passphrase = this.loginService.generateNewPassphrase();
    console.log(passphrase);
  }

  ngOnInit() {
    // console.log(this.blockService.getLastBlock());
  }
}
