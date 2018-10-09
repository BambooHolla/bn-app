import { Component, Optional, ViewChild, ElementRef } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  Refresher,
  Content,
  ViewController,
} from "ionic-angular/index";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
type buttonOptions = {
  text: string;
  handler?: Function;
  cssClass?: string;
};

@Component({
  selector: "page-custom-dialog",
  templateUrl: "custom-dialog.html",
})
export class CustomDialogPage extends FirstLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController
  ) {
    super(navCtrl, navParams);
  }
  content_message = "";
  content_title = "";
  content_subTitle = "";
  buttons: Array<buttonOptions> = [];
  cssClass = "";
  iconType = "";
  @CustomDialogPage.willEnter
  initParams() {
    var buttons = this.navParams.get("buttons");
    if (buttons instanceof Array) {
      buttons = buttons.map(b => {
        if (typeof b === "string") {
          return {
            text: b,
          };
        }
        return b;
      });
      this.buttons = buttons;
    }
    this.content_title = this.navParams.get("title");
    this.content_subTitle = this.navParams.get("subTitle");
    const message = this.navParams.get("message");
    if (typeof message === "string" && message.startsWith("@@")) {
      this.content_message = this.getTranslateSync(message.substr(2));
    } else {
      this.content_message = message;
    }
    this.iconType = this.navParams.get("iconType");
    this.cssClass = this.navParams.get("cssClass");
  }
  closeDialog() {
    this.viewCtrl.dismiss();
  }
  @asyncCtrlGenerator.error()
  async runButtonHandler(button: buttonOptions) {
    var res;
    if (button.handler instanceof Function) {
      res = await button.handler();
    }
    if (!res) {
      this.closeDialog();
    }
  }
  tryCloseDialog(event) {
    if (event.target.classList.contains("scroll-content")) {
      if (this.buttons.length == 0) {
        this.closeDialog();
      }
    }
  }
}
