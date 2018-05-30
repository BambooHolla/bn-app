import {
  Component,
  ViewChild,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  ElementRef,
  Renderer2,
  ContentChildren,
  QueryList,
} from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { IonicPage, NavController, Tabs } from "ionic-angular";
import { MyApp } from "../../app/app.component";
import { FLP_Lifecycle } from "../../bnqkl-framework/FLP_Lifecycle";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { AppSettingProvider } from "../../providers/app-setting/app-setting";
import { AppFetchProvider } from "../../providers/app-fetch/app-fetch";

import { Tab1Root, Tab2Root, Tab3Root, Tab4Root } from "../pages";
import { TabVotePage } from "../tab-vote/tab-vote";
import { TabChainPage } from "../tab-chain/tab-chain";
import { TabPayPage } from "../tab-pay/tab-pay";
import { TabAccountPage } from "../tab-account/tab-account";

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
    public fetch: AppFetchProvider,
    public r2: Renderer2,
    public elRef: ElementRef,
    public cdRef: ChangeDetectorRef,
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

  @ViewChild("voteTab") voteTab!: TabVotePage;
  @ViewChild("chainTab") chainTab!: TabChainPage;
  @ViewChild("payTab") payTab!: TabPayPage;
  @ViewChild("accountTab") accountTab!: TabAccountPage;
  pageItemQueryList!: NodeListOf<HTMLDivElement>;
  selectedTabPageContainer?: HTMLDivElement;
  selectedTabPage?: FirstLevelPage;
  selectedIndex = -1;
  selectTab(index: number) {
    if (this.selectedIndex === index) {
      return;
    }
    const tabPageContainer = this.pageItemQueryList[index];
    const tabPage = [this.voteTab, this.chainTab, this.payTab, this.accountTab][
      index
    ];
    const perTabPage = this.selectedTabPage;
    if (perTabPage) {
      perTabPage.ionViewWillLeave();
      // this.raf(() => {
        perTabPage.ionViewDidLeave();
      // });
    }

    tabPage.ionViewWillEnter();
    // this.raf(() => {
      tabPage.ionViewDidEnter();
    // });
    // 页面切换动画
    const perTabPageContainer = this.selectedTabPageContainer;
    if (perTabPageContainer) {
      perTabPageContainer.style.display = "none";
    }
    tabPageContainer.style.display = "";

    // 更新缓存
    this.selectedTabPageContainer = tabPageContainer;
    this.selectedTabPage = tabPage;
    this.selectedIndex = index;
  }
  @TabsPage.afterContentInit
  initTabView() {
    // 初始化组件的监听
    [this.voteTab, this.chainTab, this.payTab, this.accountTab].forEach(
      tabPage => {
        tabPage.event.on(
          "tabs:setBgTransparent",
          this.setBgTransparent.bind(this),
        );
        tabPage.event.on("tabs:hideTabs", this.hideTabs.bind(this));
      },
    );
    // 初始化QueryList对象
    this.pageItemQueryList = (this.elRef
      .nativeElement as HTMLElement).querySelectorAll(".page-item-container");
    for (let i = 0; i < this.pageItemQueryList.length; i += 1) {
      const pageContainerNode = this.pageItemQueryList[i];
      pageContainerNode.style.display = "none";
    }
    this.selectTab(this.default_select_index);
  }

  // @TabsPage.willEnter
  // fixStaturBug() {
  //    this.myapp.tryOverlaysWebView();
  // }

  private _hidden_tabs = new Set();
  @ViewChild(Tabs) tabs!: Tabs;
  hideTabs(hidden: boolean, key: string) {
    if (hidden) {
      this._hidden_tabs.add(key);
    } else {
      this._hidden_tabs.delete(key);
    }
    this.cdRef.markForCheck();
  }
  getTabsHidden() {
    return this._hidden_tabs.size > 0;
  }

  private _transparent_tabs = new Set();
  setBgTransparent(is_tran: boolean, key: string) {
    if (is_tran) {
      this._transparent_tabs.add(key);
    } else {
      this._transparent_tabs.delete(key);
    }
    this.cdRef.markForCheck();
  }
  getBgTransparent() {
    return this._transparent_tabs.size > 0;
  }
  private _default_select_index: 0 | 1 | undefined;
  get default_select_index() {
    if (this._default_select_index === undefined) {
      this._default_select_index = 0;
      if (this.isIOS) {
        const in_ios_check = localStorage.getItem("#in-ios-check");
        if (in_ios_check) {
          this._default_select_index = 1;
        }
      }
    }
    return this._default_select_index;
  }

  @TabsPage.willEnter
  iosCheckShim() {
    if (this.default_select_index === 1) {
      this.hideTabs(true, "ios-check");
    }
  }
}
