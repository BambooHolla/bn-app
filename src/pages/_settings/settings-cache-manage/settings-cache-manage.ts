import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";

/**
 * Generated class for the SettingsCacheManagePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({ name: "settings-cache-manage" })
@Component({
  selector: "page-settings-cache-manage",
  templateUrl: "settings-cache-manage.html",
})
export class SettingsCacheManagePage {
  constructor(public navCtrl: NavController, public navParams: NavParams) {}
}
