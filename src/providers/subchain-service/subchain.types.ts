
export type SubchainBaseModel = {
  id: string;
  magic: string;
  abbreviation: string;
}
export type SubchainModelWithSafeUrl = SubchainBaseModel & {
  logo_safe_url: import("@angular/platform-browser").SafeUrl;
  banner_safe_url: import("@angular/platform-browser").SafeUrl;
}
