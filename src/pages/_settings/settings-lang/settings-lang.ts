import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";

@IonicPage({ name: "settings-lang" })
@Component({
  selector: "page-settings-lang",
  templateUrl: "settings-lang.html",
})
export class SettingsLangPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
  ) {
    super(navCtrl, navParams, true, tabs);
    this.auto_header_shadow_when_scroll_down = true;
  }
  // TODO: use this.translate.getLangs() replace with lang_code_list
  lang_code_list = [
    "zh-cmn-Hans",
    "zh-cmn-Hant",
    "en",
    "ja",
    "es",
    "fr",
    "de",
    "it",
  ];
  lang_list = this._setLangList();
  /** 变更语言列表Subtitle内容
   */
  private _setLangList() {
    if (!this.lang_list) {
      const current_lang_map = this.translate.getTranslation(
        this.translate.currentLang,
      );
      const base_list = this.lang_code_list.map(lang_code => {
        return {
          lang_code,
          lang_source_name: this.translate
            .getTranslation(lang_code)
            .map(val_map => {
              console.log("getTranslation", lang_code, val_map);
              return val_map["LANG_" + lang_code];
            }),
          lang_trans_name: current_lang_map.map(
            val_map => val_map["LANG_" + lang_code],
          ),
        };
      });
      this.lang_list = base_list;
    } else {
      this.lang_list.forEach(lang => {
        lang.lang_trans_name = this.translate.get("LANG_" + lang.lang_code);
      });
    }
    return this.lang_list;
  }

  setLang(lang_code) {
    return this.translate
      .use(lang_code)
      .toPromise()
      .then(res => {
        this.appSetting.settings.lang = this.translate.currentLang;
        this._setLangList();
        this.finishJob();
        return res;
      });
  }
}
