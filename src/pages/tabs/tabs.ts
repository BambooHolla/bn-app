import {
  Component,
  ViewChild,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { IonicPage, NavController, Tabs } from "ionic-angular";
import { MyApp } from "../../app/app.component";
import { FLP_Lifecycle } from "../../bnqkl-framework/FLP_Lifecycle";
import { AppSettingProvider } from "../../providers/app-setting/app-setting";

import { Tab1Root } from "../pages";
import { Tab2Root } from "../pages";
import { Tab3Root } from "../pages";
import { Tab4Root } from "../pages";

// @IonicPage({ name: "tabs" })
@Component({
  selector: "page-tabs",
  templateUrl: "tabs.html",
})
export class TabsPage extends FLP_Lifecycle {
  tab1Root: any = Tab1Root;
  tab2Root: any = Tab2Root;
  tab3Root: any = Tab3Root;
  tab4Root: any = Tab4Root;

  tab1Title = " ";
  tab2Title = " ";
  tab3Title = " ";
  tab4Title = " ";

  constructor(
    public navCtrl: NavController,
    public translateService: TranslateService,
    public myapp: MyApp,
    public appSetting: AppSettingProvider,
  ) {
    super();
    translateService
      .stream(["TAB1_TITLE", "TAB2_TITLE", "TAB3_TITLE", "TAB4_TITLE"])
      .subscribe(values => {
        this.tab1Title = values["TAB1_TITLE"];
        this.tab2Title = values["TAB2_TITLE"];
        this.tab3Title = values["TAB3_TITLE"];
        this.tab4Title = values["TAB4_TITLE"];
      });
  }
  get is_power_saving_mode() {
    return this.appSetting.settings.power_saving_mode;
  }

  @TabsPage.onInit
  watchSelectIndex() {
    this.tabs.ionChange.subscribe(() => {
      const selected_index = this.tabs.getIndex(this.tabs.getSelected());
      this.tabs.setElementAttribute("select-index", selected_index);
    });
  }
  // @TabsPage.willEnter
  // fixStaturBug() {
  //    this.myapp.tryOverlaysWebView();
  // }

  private _hidden_tabs = new Set();
  @ViewChild(Tabs) tabs!: Tabs;
  hideTabs(hidden: boolean, key: string) {
    if (this.tabs) {
      if (hidden) {
        this._hidden_tabs.add(key);
      } else {
        this._hidden_tabs.delete(key);
      }
      // console.log(this._hidden_tabs.size);
      this.tabs.setTabbarHidden(this._hidden_tabs.size > 0);
    }
  }
  getTabsHidden() {
    return this._hidden_tabs.size > 0;
  }

  private _transparent_tabs = new Set();
  transparent_tab_bg = false;
  setBgTransparent(is_tran: boolean, key: string) {
    if (this.tabs) {
      if (is_tran) {
        this._transparent_tabs.add(key);
      } else {
        this._transparent_tabs.delete(key);
      }
    }
  }
  getBgTransparent() {
    return this._transparent_tabs.size > 0;
  }
}
