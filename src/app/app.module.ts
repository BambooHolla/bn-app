import { HttpClient, HttpClientModule } from "@angular/common/http";
import { HttpModule } from "@angular/http";
import { ErrorHandler, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { Camera } from "@ionic-native/camera";
import { SplashScreen } from "@ionic-native/splash-screen";
import { Keyboard } from "@ionic-native/keyboard";
import { Toast } from "@ionic-native/toast";
import { StatusBar } from "@ionic-native/status-bar";
import { IonicStorageModule, Storage } from "@ionic/storage";
import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { IonicApp, IonicErrorHandler, IonicModule } from "ionic-angular";

import { MyApp } from "./app.component";
import { SettingsProvider } from "../providers/settings/settings";
import { AppFetchProvider } from "../providers/app-fetch/app-fetch";
import { AppSettingProvider } from "../providers/app-setting/app-setting";
import { LoginServiceProvider } from "../providers/login-service/login-service";
import { AccountServiceProvider } from "../providers/account-service/account-service";

import { ComponentsModule } from "../components/components.module";
import { BlockServiceProvider } from '../providers/block-service/block-service';
import { TransactionServiceProvider } from '../providers/transaction-service/transaction-service';
// The translate loader needs to know where to load i18n files
// in Ionic's static asset pipeline.
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}

export function provideSettings(storage: Storage) {
  /**
   * The Settings provider takes a set of default settings for your app.
   *
   * You can add new settings options at any time. Once the settings are saved,
   * these values will not overwrite the saved values (this can be done manually if desired).
   */
  return new SettingsProvider(storage, {
    option1: true,
    option2: "Ionitron J. Framework",
    option3: "3",
    option4: "Hello",
  });
}

@NgModule({
  declarations: [MyApp],
  imports: [
    BrowserModule,
    HttpClientModule,
    HttpModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
    IonicModule.forRoot(MyApp, {
      backButtonText: "",
      iconMode: "ios",
      mode: "ios",
      scrollPadding: false,
      scrollAssist: false,
      autoFocusAssist: false,
      statusbarPadding: false,
      swipeBackEnabled: true,
    }),
    IonicStorageModule.forRoot(),
    ComponentsModule,
  ],
  bootstrap: [IonicApp],
  entryComponents: [MyApp],
  providers: [
    Camera,
    SplashScreen,
    Keyboard,
    Toast,
    StatusBar,
    { provide: SettingsProvider, useFactory: provideSettings, deps: [Storage] },
    // Keep this to enable Ionic's runtime error handling during development
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    AppFetchProvider,
    AppSettingProvider,
    LoginServiceProvider,
    AccountServiceProvider,
    BlockServiceProvider,
    TransactionServiceProvider,
  ],
})
export class AppModule {}
