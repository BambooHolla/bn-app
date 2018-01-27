import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams, Refresher } from "ionic-angular";

enum InOutSubPage {
  IN_VOTE = "in-vote",
  OUT_VOTE = "out-vote",
}

@IonicPage({ name: "vote-list" })
@Component({
  selector: "page-vote-list",
  templateUrl: "vote-list.html",
})
export class VoteListPage extends SecondLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    @Optional() public tabs: TabsPage,
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  InOutSubPage = InOutSubPage;
  current_page = InOutSubPage.OUT_VOTE;
  gotoSubPage(page: InOutSubPage) {
    this.current_page = page;
  }

  out_vote_list: any[];
  out_vote_list_config = {
    page: 0,
    pageSize: 20,
    has_more: true,
  };
  @VoteListPage.willEnter
  async loadOutVoteList(refresher?: Refresher) {
    await new Promise(cb => setTimeout(cb, 1000));
    const { out_vote_list_config } = this;
    // 重置分页
    out_vote_list_config.page = 0;
    this.out_vote_list = Array.from(Array(out_vote_list_config.pageSize));
    if (refresher) {
      refresher.complete();
    }
  }
  async loadMoreOutVoteList() {
    await new Promise(cb => setTimeout(cb, 1000));
    const { out_vote_list_config } = this;
    // 重置分页
    out_vote_list_config.page += 0;
    this.out_vote_list.push(
      ...Array.from(Array(out_vote_list_config.pageSize)),
    );
    out_vote_list_config.has_more = this.out_vote_list.length < 110;
    if (!out_vote_list_config.has_more) {
      this.out_vote_list.length = 110;
    }
  }
}
