import { Component, ViewChild, ElementRef } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { EarthNetMeshComponent } from "../../components/earth-net-mesh/earth-net-mesh";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { LoginServiceProvider } from "../../providers/login-service/login-service";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { MyApp } from "../../app/app.component";
import { MainPage } from "../pages";
import {
  LoginFormInOut,
  RegisterFormInOut,
} from "./sign-in-and-sign-up.animations";

@IonicPage({ name: "sign-in-and-sign-up" })
@Component({
  selector: "page-sign-in-and-sign-up",
  templateUrl: "sign-in-and-sign-up.html",
  animations: [LoginFormInOut, RegisterFormInOut],
})
export class SignInAndSignUpPage extends FirstLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public loginService: LoginServiceProvider,
    public myApp: MyApp,
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
    email: "",
    phone: "",
    remark: "",
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
    this.earth.rotateMeshsZ(0, 500, -1);
  }

  get canDoLogin() {
    return this.formData.pwd;
  }
  @asyncCtrlGenerator.error(() =>
    SignInAndSignUpPage.getTranslate("LOGIN ERROR"),
  )
  @asyncCtrlGenerator.loading()
  async doLogin() {
    await this.loginService.doLogin(this.formData.pwd);
    // this.myApp.openPage(MainPage);
    this.routeTo("scan-nodes");
  }
  gotoRegister() {
    this.page_status = "register";
    this.earth.rotateMeshsZ(Math.PI, 500, -1);
  }
  get canDoRegister() {
    return this.allHaveValues(this.formData);
  }
  doRegister() {}
}
