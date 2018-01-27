import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";

@IonicPage({ name: "search" })
@Component({
  selector: "page-search",
  templateUrl: "search.html",
})
export class SearchPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
  ) {
    super(navCtrl, navParams, true, tabs);
  }
}
