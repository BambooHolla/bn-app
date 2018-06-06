
export type PEER_INFO = {
  title: string;
  config: {
    SERVER_URL: string;
    NET_VERSION: string;
    BLOCK_UNIT_TIME: string | number;
    HIDE_FLAG?: string;
  };
}
export type LATEST_VERSION_INFO = {
  [x: string]: any;
  version: string;
  android_version?: string;
  ios_version?: string;
  changelogs: string[];
  android_changelogs?: string[];
  ios_changelogs?: string[];
  hotreload_version: string;
  download_link_android: string;
  download_link_ios_plist: string;
  download_link_web: string;
  share_message?: string;
  share_link?: string;
  share_image_url?: string;
  create_time: number;
  apk_size: number;
  plist_size: number;
  ios_app_store_link: string;
  disable_android?: boolean;
  disable_ios?: boolean;
  /** 是否处于IOS审核期间 */
  in_ios_check?: boolean;
  "//": string;
  peer_list?:PEER_INFO[]
};
