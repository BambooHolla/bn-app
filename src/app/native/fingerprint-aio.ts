import { Injectable } from "@angular/core";
import { Plugin, Cordova, IonicNativePlugin } from "@ionic-native/core";

export interface FingerprintOptions {
  /**
   * Key for platform keychain
   */
  clientId: string;

  /**
   * Secret password. Only for android
   */
  clientSecret?: string;

  /**
   * Disable cancel button option. Only for android (optional)
   */
  disableCancel?: boolean;

  /**
   * Disable 'use backup 手势密码' option. Only for android (optional)
   */
  disableBackup?: boolean;

  /**
   * Title of fallback button. Only for iOS
   */
  localizedFallbackTitle?: string;

  /**
   * Description in authentication dialogue. Only for iOS
   */
  localizedReason?: string;

  /**
   * default is 取消 . Only for Android
   */
  fingerprint_cancel?: string;
  /**
   * default is 使用手势密码 . Only for Android
   */
  fingerprint_use_backup?: string;
  /**
   * default is 指纹识别 . Only for Android
   */
  fingerprint_auth_dialog_title?: string;
  /**
   * default is 确认 . Only for Android
   */
  fingerprint_ok?: string;
  /**
   * default is 指纹识别 . Only for Android
   */
  fingerprint_description?: string;
  /**
   * default is 请触摸指纹识传感器 . Only for Android
   */
  fingerprint_hint?: string;
  /**
   * default is 指纹无法识别，请再试一次 . Only for Android
   */
  fingerprint_not_recognized?: string;
  /**
   * default is 指纹识别成功 . Only for Android
   */
  fingerprint_success?: string;
  /**
   * default is 添加一个新的指纹，需要设置密码 . Only for Android
   */
  new_fingerprint_enrolled_description?: string;
  /**
   * default is 需要安全锁屏 . Only for Android
   */
  secure_lock_screen_required?: string;
}

/**
 * @name Fingerprint AIO
 * @description
 * Use simple fingerprint authentication on Android and iOS.
 * Requires Cordova plugin: cordova-plugin-fingerprint-aio. For more info about plugin, vist: https://github.com/NiklasMerz/cordova-plugin-fingerprint-aio
 *
 * @usage
 * ```typescript
 * import { FingerprintAIO } from '@ionic-native/fingerprint-aio';
 *
 * constructor(private faio: FingerprintAIO) { }
 *
 * ...
 *
 * this.faio.show({
 *     clientId: 'Fingerprint-Demo',
 *     clientSecret: 'password', //Only necessary for Android
 *     disableBackup:true,  //Only for Android(optional)
 *     localizedFallbackTitle: 'Use Pin', //Only for iOS
 *     localizedReason: 'Please authenticate' //Only for iOS
 * })
 * .then((result: any) => console.log(result))
 * .catch((error: any) => console.log(error));
 *
 * ```
 * @interfaces
 * FingerprintOptions
 */
@Plugin({
  pluginName: "FingerprintAIO",
  plugin: "cordova-plugin-fingerprint-aio",
  pluginRef: "Fingerprint",
  repo: "https://github.com/Gaubee/cordova-plugin-fingerprint-aio",
  platforms: ["Android", "iOS"],
})
@Injectable()
export class FingerprintAIO extends IonicNativePlugin {
  /**
   * Check if fingerprint authentication is available
   * @return {Promise<any>} Returns a promise with result
   */
  @Cordova()
  isAvailable(): Promise<any> {
    var res: any;
    return res;
  }

  /**
   * Show authentication dialogue
   * @param options {FingerprintOptions} options for platform specific fingerprint API
   * @return {Promise<any>} Returns a promise that resolves when authentication was successfull
   */
  @Cordova()
  show(options: FingerprintOptions): Promise<any> {
    var res: any;
    return res;
  }
}
