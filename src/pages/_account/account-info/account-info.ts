import { Component, Optional, ViewChild } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
} from "ionic-angular";
// import { KjuaQrcodeComponent } from "../../../components/kjua-qrcode/kjua-qrcode";

@IonicPage({ name: "account-info" })
@Component({
  selector: "page-account-info",
  templateUrl: "account-info.html",
})
export class AccountInfoPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
    public viewCtrl: ViewController,
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  // @ViewChild(KjuaQrcodeComponent) qrcode!: KjuaQrcodeComponent;
}
