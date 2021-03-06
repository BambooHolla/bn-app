// 强行使用indexed来模拟filesystem api，来突破配额限制
import * as ifs from "idb.filesystem";
// self["webkitRequestFileSystem"] = webkitRequestFileSystem;
// self["requestFileSystem"] = requestFileSystem;
console.log("ifs", ifs, self["requestFileSystem"], self["webkitRequestFileSystem"]);

import lazy_links from "./serializer-links";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { HttpModule } from "@angular/http";
import { ErrorHandler, NgModule, InjectionToken, APP_INITIALIZER, NgZone } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import {
  BrowserAnimationsModule,
  // NoopAnimationsModule,
} from "@angular/platform-browser/animations";
import { AndroidPermissions } from "@ionic-native/android-permissions";
import { BarcodeScanner } from "@ionic-native/barcode-scanner";
import { Camera } from "@ionic-native/camera";
import { Device } from "@ionic-native/device";
import { SplashScreen } from "@ionic-native/splash-screen";
import { Keyboard } from "@ionic-native/keyboard";
import { Toast } from "@ionic-native/toast";
import { Clipboard } from "@ionic-native/clipboard";
import { StatusBar } from "@ionic-native/status-bar";
import { Screenshot } from "@ionic-native/screenshot";
import { SocialSharing } from "@ionic-native/social-sharing";
import { FileTransfer } from "@ionic-native/file-transfer";
import { ThemeableBrowser } from "@ionic-native/themeable-browser";
import { Network } from "@ionic-native/network";
import { NetworkInterface } from "@ionic-native/network-interface";
import { File } from "@ionic-native/file";
import { FileOpener } from "@ionic-native/file-opener";
import { LocalNotifications } from "@ionic-native/local-notifications";
import { FingerprintAIO } from "./native/fingerprint-aio";
import { EmailComposer } from "@ionic-native/email-composer";
import { IonicStorageModule, Storage } from "@ionic/storage";
import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { ColorPickerModule } from "ngx-color-picker";
// import {
//   MatFormFieldModule,
//   MatInputModule,
//   MatAutocompleteModule,
//   MatMenuModule,
//   MatGridListModule,
//   MatButtonModule,
//   MatIconModule,
//   MatChipsModule,
// } from "@angular/material";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatChipsModule } from "@angular/material/chips";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatMenuModule } from "@angular/material/menu";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatFormFieldModule } from "@angular/material/form-field";

import { IonicErrorHandler } from 'ionic-angular/util/ionic-error-handler'
import { IonicModule } from 'ionic-angular/module'
import { DeepLinkConfigToken, UrlSerializer } from 'ionic-angular/navigation/url-serializer'
import { App } from "ionic-angular/components/app/app"
import { IonicApp } from "ionic-angular/components/app/app-root"
// import { IonicApp } from "ionic-angular/components/app/app-root";
// import { ClickBlock } from "ionic-angular/components/app/click-block";
// import { OverlayPortal } from "ionic-angular/components/app/overlay-portal";
import { setupUrlSerializer } from "ionic-angular/navigation/url-serializer";
// import { MyIonicModule as IonicModule  } from "./module";

import { VirtualScrollModule } from "angular2-virtual-scroll";

import { MyApp } from "./app.component";
import { AppFetchProvider } from "../providers/app-fetch/app-fetch";
import { AppSettingProvider } from "../providers/app-setting/app-setting";
import { LoginServiceProvider } from "../providers/login-service/login-service";
import { AccountServiceProvider } from "../providers/account-service/account-service";

import { ComponentsModule } from "../components/components.module";

import { DirectivesModule } from "../directives/directives.module";
import { PipesModule } from "../pipes/pipes.module";
import { MomentModule } from "angular2-moment";
import { BlockServiceProvider } from "../providers/block-service/block-service";
import { TransactionServiceProvider } from "../providers/transaction-service/transaction-service";
import { TransferProvider } from "../providers/transfer/transfer";
import { PeerServiceProvider } from "../providers/peer-service/peer-service";
import { ContactServiceProvider } from "../providers/contact-service/contact-service";
import { MinServiceProvider } from "../providers/min-service/min-service";
import { BenefitServiceProvider } from "../providers/benefit-service/benefit-service";
import { UserInfoProvider } from "../providers/user-info/user-info";

// 预加载页面
import { UserAgreementPage } from "../pages/user-agreement/user-agreement";
import { CustomDialogPage } from "../pages/custom-dialog/custom-dialog";
import { TutorialPage } from "../pages/tutorial/tutorial";
import { SignInAndSignUpPage } from "../pages/sign-in-and-sign-up/sign-in-and-sign-up";
import { TabsPage } from "../pages/tabs/tabs";
import { TabVotePage } from "../pages/tab-vote/tab-vote";
import { TabChainPage } from "../pages/tab-chain/tab-chain";
import { TabPayPage } from "../pages/tab-pay/tab-pay";
import { TabAccountPage } from "../pages/tab-account/tab-account";
import { CoverTabsCtrlModelPage } from "../pages/cover-tabs-ctrl-model/cover-tabs-ctrl-model";
import { NewsProvider } from "../providers/news/news";
// The translate loader needs to know where to load i18n files
// in Ionic's static asset pipeline.
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}
// 预加载的组件
import { VoteCurrentBlockIncomeComponent } from "../components/vote-current-block-income/vote-current-block-income";
import { VoteIncomeTrendComponent } from "../components/vote-income-trend/vote-income-trend";
import { VoteMyContributionComponent } from "../components/vote-my-contribution/vote-my-contribution";
import { VotePreRoundIncomeRateComponent } from "../components/vote-pre-round-income-rate/vote-pre-round-income-rate";
import { VotePreRoundIncomeRankingComponent } from "../components/vote-pre-round-income-ranking/vote-pre-round-income-ranking";

import { ClipAssetsLogoComponent } from "../components/clip-assets-logo/clip-assets-logo";
import { ClipSubchainLogoComponent } from "../components/clip-subchain-logo/clip-subchain-logo";
import { ClipSubchainBannerComponent } from "../components/clip-subchain-banner/clip-subchain-banner";
import { ModalComponent } from "../components/modal/modal";
import { PopoverComponent } from "../components/popover/popover";

import { SecondLevelPage } from "../bnqkl-framework/SecondLevelPage";
import { DbCacheProvider } from "../providers/db-cache/db-cache";
import { VoucherServiceProvider } from "../providers/voucher-service/voucher-service";
import { LocalContactProvider } from "../providers/local-contact/local-contact";
import { AssetsServiceProvider } from "../providers/assets-service/assets-service";
import { SubchainServiceProvider } from "../providers/subchain-service/subchain-service";
import { IpServiceProvider } from '../providers/ip-service/ip-service';

export const MyDeepLinkConfigToken = new InjectionToken<any>("USERLINKS");

export function customDeepLinkConfig(deepLinkConfig) {
  const static_links = [
    { component: UserAgreementPage, name: "user-agreement" },
    { component: CustomDialogPage, name: "custom-dialog" },
    { component: TutorialPage, name: "tutorial" },
    { component: TabsPage, name: "tabs" },
    { component: SignInAndSignUpPage, name: "sign-in-and-sign-up" },
    { component: TabVotePage, name: "tab-vote" },
    { component: TabChainPage, name: "tab-chain" },
    { component: TabPayPage, name: "tab-pay" },
    { component: TabAccountPage, name: "tab-account" },
    { component: CoverTabsCtrlModelPage, name: "cover-tabs-ctrl-model" },
  ];
  if (deepLinkConfig && deepLinkConfig.links) {
    const static_links_name_set = new Set(static_links.map(link => link.name));
    deepLinkConfig.links = deepLinkConfig.links.filter(link => !static_links_name_set.has(link.name as string));
    deepLinkConfig.links.push(...static_links);
  }
  return deepLinkConfig;
}

const pages = [MyApp, UserAgreementPage, CustomDialogPage, TutorialPage, SignInAndSignUpPage, TabsPage, CoverTabsCtrlModelPage];
const heightLevelModules = [
  VoteCurrentBlockIncomeComponent,
  VoteIncomeTrendComponent,
  VoteMyContributionComponent,
  VotePreRoundIncomeRateComponent,
  VotePreRoundIncomeRankingComponent,
  TabVotePage,
  TabChainPage,
  TabPayPage,
  TabAccountPage,
];

@NgModule({
  declarations: [
    ...pages,
    ...heightLevelModules,
    // IonicApp,
    // ClickBlock,
    // OverlayPortal,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    // NoopAnimationsModule,
    HttpClientModule,
    HttpModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
    IonicStorageModule.forRoot(),
    IonicModule.forRoot(MyApp, {
      backButtonText: "",
      iconMode: "ios",
      mode: "ios",
      pageTransition: "common-transition",
      scrollPadding: false,
      scrollAssist: false,
      autoFocusAssist: false,
      statusbarPadding: true,
      swipeBackEnabled: false,
      preloadModules: false,
      // tabsHideOnSubPages: true,// 这个有BUG，不要用。
    }),
    ComponentsModule,
    DirectivesModule,
    PipesModule,
    MomentModule,
    VirtualScrollModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatGridListModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  bootstrap: [IonicApp],
  entryComponents: [ClipAssetsLogoComponent, ClipSubchainLogoComponent, ClipSubchainBannerComponent, ModalComponent, PopoverComponent, ...pages],
  providers: [
    AndroidPermissions,
    BarcodeScanner,
    Camera,
    Device,
    SplashScreen,
    Keyboard,
    Toast,
    Clipboard,
    StatusBar,
    Screenshot,
    SocialSharing,
    FileTransfer,
    ThemeableBrowser,
    Network,
    NetworkInterface,
    File,
    FileOpener,
    LocalNotifications,
    FingerprintAIO,
    EmailComposer,
    // Keep this to enable Ionic's runtime error handling during development
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    AppFetchProvider,
    AppSettingProvider,
    LoginServiceProvider,
    AccountServiceProvider,
    BlockServiceProvider,
    TransactionServiceProvider,
    TransferProvider,
    PeerServiceProvider,
    ContactServiceProvider,
    MinServiceProvider,
    BenefitServiceProvider,
    UserInfoProvider,
    NewsProvider,
    {
      provide: MyDeepLinkConfigToken,
      useFactory: customDeepLinkConfig,
      deps: [DeepLinkConfigToken],
    },
    {
      provide: UrlSerializer,
      useFactory: setupUrlSerializer,
      deps: [App, MyDeepLinkConfigToken],
    },
    DbCacheProvider,
    VoucherServiceProvider,
    LocalContactProvider,
    AssetsServiceProvider,
    SubchainServiceProvider,
    SubchainServiceProvider,
    IpServiceProvider,
  ],
})
export class AppModule { }
