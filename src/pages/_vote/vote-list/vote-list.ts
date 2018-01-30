import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams, Refresher } from "ionic-angular";
import {
  MinServiceProvider,
  DelegateModel,
} from "../../../providers/min-service/min-service";

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
    public minService: MinServiceProvider,
  ) {
    super(navCtrl, navParams, true, tabs);
  }
  InOutSubPage = InOutSubPage;
  current_page = InOutSubPage.OUT_VOTE;
  gotoSubPage(page: InOutSubPage) {
    if (page in InOutSubPage) {
      console.warn(`${page} no via page`);
      return;
    }
    this.current_page = page;
  }
  /**投出去的票*/
  out_vote_list: DelegateModel[] = [];
  out_vote_list_config = {
    page: 1,
    pageSize: 20,
    has_more: true,
  };
  can_vote_list: DelegateModel[] = [];
  can_vote_list_config = {
    page: 1,
    pageSize: 20,
    has_more: true,
  };
  /**被投的票*/
  in_vote_list: DelegateModel[] = [];
  in_vote_list_config = {
    page: 1,
    pageSize: 20,
    has_more: true,
  };
  @VoteListPage.willEnter
  loadDataWhenEnter() {
    const page = this.navParams.get("page");
    if (page) {
      this.gotoSubPage(page);
    }
    if (this.current_page === InOutSubPage.IN_VOTE) {
      this.loadInVoteList();
    } else {
      this.loadOutVoteList();
    }
  }

  @asyncCtrlGenerator.loading(() =>
    VoteListPage.getTranslate("LOADING_OUT_VOTE_LIST"),
  )
  @asyncCtrlGenerator.error(() =>
    VoteListPage.getTranslate("LOAD_OUT_VOTE_LIST_ERROR"),
  )
  async loadOutVoteList(refresher?: Refresher) {
    const { out_vote_list_config } = this;
    // 重置分页
    out_vote_list_config.page = 1;
    debugger

    const list = await this.minService.getMyVotes(
      out_vote_list_config.page,
      out_vote_list_config.pageSize,
    );
    this.out_vote_list = list;
    if (refresher) {
      refresher.complete();
    }
  }
  @asyncCtrlGenerator.error(() =>
    VoteListPage.getTranslate("LOAD_MORE_OUT_VOTE_LIST_ERROR"),
  )
  async loadMoreOutVoteList() {
    const { out_vote_list_config } = this;
    // 重置分页
    out_vote_list_config.page += 1;

    const list = await this.minService.getMyVotes(
      out_vote_list_config.page,
      out_vote_list_config.pageSize,
    );
    this.out_vote_list.push(...list);

    out_vote_list_config.has_more =
      list.length >= out_vote_list_config.pageSize;
  }
  @asyncCtrlGenerator.loading(() =>
    VoteListPage.getTranslate("LOADING_IN_VOTE_LIST"),
  )
  @asyncCtrlGenerator.error(() =>
    VoteListPage.getTranslate("LOAD_IN_VOTE_LIST_ERROR"),
  )
  async loadInVoteList(refresher?: Refresher) {
    const { in_vote_list_config } = this;
    // 重置分页
    in_vote_list_config.page = 1;

    const list = await this.minService.getMyVotes(
      in_vote_list_config.page,
      in_vote_list_config.pageSize,
    );
    this.in_vote_list = list;
    if (refresher) {
      refresher.complete();
    }
  }
  @asyncCtrlGenerator.error(() =>
    VoteListPage.getTranslate("LOAD_MORE_IN_VOTE_LIST_ERROR"),
  )
  async loadMoreInVoteList() {
    const { in_vote_list_config } = this;
    // 重置分页
    in_vote_list_config.page += 1;
    this.in_vote_list.push(...Array.from(Array(in_vote_list_config.pageSize)));
    in_vote_list_config.has_more = this.in_vote_list.length < 110;
  }
}
