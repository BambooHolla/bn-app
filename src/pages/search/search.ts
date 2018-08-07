import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../tabs/tabs";
import {
  IonicPage,
  NavController,
  NavParams,
  ViewController,
} from "ionic-angular";
import { SearchType } from "./search.const";
export * from "./search.const";

@IonicPage({ name: "search" })
@Component({
  selector: "page-search",
  templateUrl: "search.html",
})
export class SearchPage extends SecondLevelPage {
  SearchType = SearchType;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    @Optional() public tabs: TabsPage
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  @SearchPage.willEnter
  init() {
    const search_type = this.navParams.get("search_type");
    if (search_type) {
      this.setSearchType(search_type);
    }
  }
  formData = {
    search_text: "",
    search_type: SearchType.ALL,
  };
  closeSearch() {
    this.viewCtrl.dismiss();
  }
  resetSearchText() {
    this.formData.search_text = "";
    this.trySearch();
  }
  search_result_list?: any[];
  setSearchType(type: SearchType) {
    if (type in SearchType) {
      this.formData.search_type = type;
    } else {
      console.warn(`未知的搜索类型：${type}`);
    }
  }

  private _search_ti: any;
  trySearch() {
    clearTimeout(this._search_ti);
    this._search_ti = setTimeout(() => {
      this.doSearch();
    }, 200);
  }

  async doSearch() {
    const { search_text, search_type } = this.formData;
    if (search_text) {
      const search_type_key = "_$search_" + SearchType[search_type];
      if (this[search_type_key] instanceof Function) {
        this.search_result_list = await this[search_type_key](search_text);
      }
    } else {
      this.search_result_list = undefined;
    }
  }
  private _$search_ALL(search_text) {
    return Promise.all([
      this._$search_VOTE_INCOME(search_text),
      this._$search_BLOCK(search_text),
      this._$search_ASSETS(search_text),
    ]).then(search_result_list => {
      var res: any[] = [];
      for (var list of search_result_list) {
        if (list instanceof Array) {
          res = res.concat(list);
        }
      }
      return res;
    });
  }
  private async _$search_VOTE_INCOME(search_text) {
    return [].map((item: any) => {
      item.search_type = SearchType.VOTE_INCOME;
      return item;
    });
  }
  private async _$search_BLOCK(search_text) {
    return [].map((item: any) => {
      item.search_type = SearchType.BLOCK;
      return item;
    });
  }
  private async _$search_ASSETS(search_text) {
    return [].map((item: any) => {
      item.search_type = SearchType.ASSETS;
      return item;
    });
  }
}
