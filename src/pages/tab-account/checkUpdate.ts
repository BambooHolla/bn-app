import { AppFetchProvider } from "../../providers/app-fetch/app-fetch";
import { AppSettingProvider } from "../../providers/app-setting/app-setting";
import { LATEST_VERSION_INFO } from "../version-update-dialog/version.types";
import { versionToNumber } from "../version-update-dialog/version-update-dialog";
import { ModalController } from "ionic-angular";
export async function getLatestVersionInfo(
  fetch: AppFetchProvider,
  lang: string,
) {
  if (!navigator.onLine) {
    return;
  }
  return await fetch.get<LATEST_VERSION_INFO>(
    AppSettingProvider.LATEST_APP_VERSION_URL,
    {
      search: {
        lang,
        ua: navigator.userAgent,
        t: Date.now(),
      },
    },
  );
}
export async function checkUpdate(
  fetch: AppFetchProvider,
  opts: {
    isAndroid: boolean;
    isIOS: boolean;
    lang: string;
    modalCtrl?: ModalController;
    onNoNeedUpdate?: (info: LATEST_VERSION_INFO) => any;
  },
  open_update_dialog = true,
) {
  const app_version_info = await getLatestVersionInfo(fetch, opts.lang);
  if (!app_version_info) {
    return;
  }
  if (app_version_info.disable_android && opts.isAndroid) {
    return app_version_info;
  }
  if (app_version_info.disable_ios && opts.isIOS) {
    return app_version_info;
  }
  var version = app_version_info.version;
  if (opts.isAndroid && app_version_info.android_version) {
    version = app_version_info.android_version;
  }
  if (opts.isIOS && app_version_info.ios_version) {
    version = app_version_info.ios_version;
  }
  if (open_update_dialog) {
    if (
      versionToNumber(version) > versionToNumber(AppSettingProvider.APP_VERSION)
    ) {
      if (opts.modalCtrl) {
        await opts.modalCtrl
          .create(
            "version-update-dialog",
            { version_info: app_version_info },
            {
              enterAnimation: "custom-dialog-pop-in",
              leaveAnimation: "custom-dialog-pop-out",
            },
          )
          .present();
      }
    } else {
      if (opts.onNoNeedUpdate instanceof Function) {
        opts.onNoNeedUpdate(app_version_info);
      }
    }
  }

  return app_version_info;
}
