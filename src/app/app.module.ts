import lazy_links from "./serializer-links";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { HttpModule } from "@angular/http";
import {
  ErrorHandler,
  NgModule,
  InjectionToken,
  APP_INITIALIZER,
  NgZone,
} from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
// import {
//   BrowserAnimationsModule,
//   NoopAnimationsModule,
// } from "@angular/platform-browser/animations";
import { AndroidPermissions } from "@ionic-native/android-permissions";
import { BarcodeScanner } from "@ionic-native/barcode-scanner";
import { Camera } from "@ionic-native/camera";
import { SplashScreen } from "@ionic-native/splash-screen";
import { Keyboard } from "@ionic-native/keyboard";
import { Toast } from "@ionic-native/toast";
import { Clipboard } from "@ionic-native/clipboard";
import { StatusBar } from "@ionic-native/status-bar";
import { Screenshot } from "@ionic-native/screenshot";
import { SocialSharing } from "@ionic-native/social-sharing";
import { FileTransfer } from "@ionic-native/file-transfer";
import { File } from "@ionic-native/file";
import { FileOpener } from "@ionic-native/file-opener";
import { LocalNotifications } from "@ionic-native/local-notifications";
import { FingerprintAIO } from "./native/fingerprint-aio";
import { IonicStorageModule, Storage } from "@ionic/storage";
import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import {
  IonicApp,
  IonicErrorHandler,
  IonicModule,
  DeepLinkConfigToken,
  Config,
  UrlSerializer,
  App,
} from "ionic-angular";
import { setupPreloading } from "ionic-angular/util/module-loader";
import {
  ModuleLoader,
  provideModuleLoader,
} from "ionic-angular/util/module-loader";
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

import { SecondLevelPage } from "../bnqkl-framework/SecondLevelPage";

export const MyDeepLinkConfigToken = new InjectionToken<any>("USERLINKS");

export function customDeepLinkConfig(deepLinkConfig) {
  const static_links = [
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
    deepLinkConfig.links = deepLinkConfig.links.filter(
      link => !static_links_name_set.has(link.name as string),
    );
    deepLinkConfig.links.push(...static_links);
  }
  return deepLinkConfig;
}

const pages = [
  MyApp,
  CustomDialogPage,
  TutorialPage,
  SignInAndSignUpPage,
  TabsPage,
  TabVotePage,
  TabChainPage,
  TabPayPage,
  TabAccountPage,
  CoverTabsCtrlModelPage,
];
const heightLevelModules = [
  VoteCurrentBlockIncomeComponent,
  VoteIncomeTrendComponent,
  VoteMyContributionComponent,
  VotePreRoundIncomeRateComponent,
  VotePreRoundIncomeRankingComponent,
];

@NgModule({
  declarations: [...pages, ...heightLevelModules],
  imports: [
    BrowserModule,
    // BrowserAnimationsModule,
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
      preloadModules: true,
      // tabsHideOnSubPages: true,// 这个有BUG，不要用。
    }),
    ComponentsModule,
    DirectivesModule,
    PipesModule,
    MomentModule,
    VirtualScrollModule,
  ],
  bootstrap: [IonicApp],
  entryComponents: pages,
  providers: [
    AndroidPermissions,
    BarcodeScanner,
    Camera,
    SplashScreen,
    Keyboard,
    Toast,
    Clipboard,
    StatusBar,
    Screenshot,
    SocialSharing,
    FileTransfer,
    File,
    FileOpener,
    LocalNotifications,
    FingerprintAIO,
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
  ],
})
export class AppModule {}
