import { Component, Optional } from "@angular/core";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { EmailComposer } from "@ionic-native/email-composer";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
} from "ionic-angular";

// @IonicPage({ name: "user-agreement" })
@Component({
  selector: "page-user-agreement",
  templateUrl: "user-agreement.html",
})
export class UserAgreementPage extends FirstLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public emailComposer: EmailComposer
  ) {
    super(navCtrl, navParams);
  }
  close() {
    this.viewCtrl.dismiss();
  }
  agree() {
    this.viewCtrl.dismiss(true);
  }
  private _anode?: HTMLAnchorElement;
  private _subject?: string;
  private _body?: string;
  async mailto() {
    // if (!this._anode) {
    // 	this._anode = document.createElement("a");
    // 	this._anode.href = `mailto:?subject=${
    // 		/*encodeURIComponent*/ (document.querySelector(
    // 			"page-user-agreement .toolbar-title",
    // 		) as HTMLElement).textContent || ""
    // 	}&body=${
    // 		/*encodeURIComponent*/ (document.querySelector(
    // 			"page-user-agreement .pdf",
    // 		) as HTMLElement).textContent || ""
    // 	}`;
    // }
    if (!this._subject) {
      this._subject =
        (document.querySelector(
          "page-user-agreement .toolbar-title"
        ) as HTMLElement).textContent || "";
    }
    if (!this._body) {
      this._body =
        (document.querySelector("page-user-agreement .pdf") as HTMLElement)
          .textContent || "";
    }
    // const clickEvent = new MouseEvent("click", {
    // 	view: window,
    // 	bubbles: true,
    // 	cancelable: true,
    // });
    // this._anode.dispatchEvent(clickEvent);

    if (!(await this.emailComposer.hasPermission())) {
      if (!(await this.emailComposer.requestPermission())) {
        return;
      }
    }
    this.emailComposer.open({
      // to: 'max@mustermann.de',
      cc: "erika@mustermann.de",
      // bcc: ['john@doe.com', 'jane@doe.com'],
      attachments: [],
      subject: this._subject,
      body: this._body,
      isHtml: true,
    });
  }
}
