import { Component } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
} from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";

@IonicPage({ name: "cover-tabs-ctrl-model" })
@Component({
  selector: "page-cover-tabs-ctrl-model",
  templateUrl: "cover-tabs-ctrl-model.html",
})
export class CoverTabsCtrlModelPage extends FirstLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
  ) {
    super(navCtrl, navParams);
  }
  closeModel() {
    const onclose = this.navParams.get("onclose");
    if (onclose instanceof Function) {
      onclose();
    }
    this.viewCtrl.dismiss();
  }
  static open(fromPage: FirstLevelPage, data, opts?) {
    return fromPage.modalCtrl
      .create(
        CoverTabsCtrlModelPage,
        data,
        Object.assign(
          {},
          {
            cssClass: "cover-tabs-ctrl-model",
          },
          opts,
        ),
      )
      .present();
  }
}
