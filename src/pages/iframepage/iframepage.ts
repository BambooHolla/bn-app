import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { Component, ViewChild } from "@angular/core";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import {
  IonicPage,
  NavController,
  NavParams,
  Loading,
  ViewController,
  Navbar,
} from "ionic-angular";

@IonicPage({ name: "iframepage" })
@Component({
  selector: "page-iframepage",
  templateUrl: "iframepage.html",
})
export class IframepagePage extends FirstLevelPage {
  redirect_url: SafeUrl;
  titleContent: string;
  navbar_color = "transparent";

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public sanitizer: DomSanitizer,
  ) {
    super(navCtrl, navParams);
    this.titleContent = navParams.get("title") || "";
    const redirect_url = navParams.get("redirect_url");
    if (redirect_url) {
      this.loading = this.loadingCtrl.create({
        content: "加载中请稍后",
        cssClass: "iframe-page-loading can-tap",
      });
      this.loading.present();
      this.redirect_url = this.sanitizer.bypassSecurityTrustResourceUrl(
        redirect_url,
      );
    }

    const navbar_color = navParams.get("navbar_color");
    if (navbar_color) {
      this.navbar_color = navbar_color;
    }
  }
  loading: Loading;

  @IframepagePage.willLeave
  autoCloseLoading() {
    this.toastCtrl
      .create({ message: "willLeave", position: "top", duration: 1000 })
      .present();
    if (this.loading) {
      this.loading.dismiss();
    }
  }
  @IframepagePage.didEnter
  keepShowLoading() {
    this.toastCtrl
      .create({ message: "didEnter", position: "bottom", duration: 1000 })
      .present();
    if (this.loading) {
      this.loading.present();
    }
  }

  private _is_leave = false;
  onIframeLoad(e) {
    if (!e.target.src || this._is_leave) {
      return;
    }
    if (this.loading) {
      console.log("CLOSE loading");
      this.loading.dismiss();
      this.loading = null;
      const load_toast = this.navParams.get("load_toast");
      if (load_toast) {
        this.toastCtrl
          .create({
            message: load_toast,
            duration: 3000,
            position: "middle",
          })
          .present();
      }
    } else {
      console.log("UNKONW loaded");
      if (this.navParams.get("auto_close_when_redirect")) {
        this.redirect_url = "";
        this._is_leave = true;
        // const pop_promise = this.navCtrl.push(
        //   this.navCtrl.getByIndex(this.navCtrl.length() - 2).component
        // );
        let pop_promise: Promise<any>;
        if (this.canGoBack) {
          pop_promise = this.navCtrl.pop();
        } else {
          pop_promise = this.closeModal();
        }
        const after_nav_pop = this.navParams.get("after_nav_pop");
        if (after_nav_pop instanceof Function) {
          pop_promise.then(after_nav_pop);
        }
      }
    }
  }
  canGoBack = this.navCtrl.canGoBack();

  closeModal() {
    return this.viewCtrl.dismiss();
  }
}
