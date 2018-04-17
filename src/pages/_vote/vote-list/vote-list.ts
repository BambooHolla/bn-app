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
    if (this.current_page === InOutSubPage.IN_VOTE) {
      this.in_vote_list_config.need_refresh && this.initInVoteList();
    } else {
      this.out_vote_list_config.need_refresh && this.initOutVoteList();
      this.can_vote_list_config.need_refresh && this.initCanVoteList();
    }
  }
  /**投出去的票*/
  out_vote_list: DelegateModel[] = [];
  out_vote_list_config = {
    page: 1,
    pageSize: 20,
    has_more: true,
    need_refresh: true,
  };
  can_vote_list: DelegateModel[] = [];
  can_vote_list_config = {
    page: 1,
    pageSize: 20,
    has_more: true,
    need_refresh: true,
  };
  /**被投的票*/
  in_vote_mill_list: any[] = [];
  in_vote_list: DelegateModel[] = [];
  in_vote_list_config = {
    page: 1,
    pageSize: 20,
    has_more: true,
    need_refresh: true,
  };
  @VoteListPage.willEnter
  loadDataWhenEnter() {
    const page = this.navParams.get("page");
    if (page) {
      this.gotoSubPage(page);
    }
  }

  @VoteListPage.addEvent("HEIGHT:CHANGED")
  watchHeightChanged(height, is_init) {
    this.out_vote_list_config.need_refresh = true;
    this.can_vote_list_config.need_refresh = true;
    this.in_vote_list_config.need_refresh = true;
    if (this.current_page === InOutSubPage.IN_VOTE) {
      this.initInVoteList();
    } else {
      this.initOutVoteList();
      this.initCanVoteList();
    }
  }

  // @asyncCtrlGenerator.loading(() =>
  //   VoteListPage.getTranslate("LOADING_OUT_VOTE_LIST"),
  // )
  initOutVoteList() {
    return this.loadOutVoteList();
  }
  @asyncCtrlGenerator.error(() =>
    VoteListPage.getTranslate("LOAD_OUT_VOTE_LIST_ERROR"),
  )
  async loadOutVoteList(refresher?: Refresher) {
    const { out_vote_list_config } = this;
    out_vote_list_config.need_refresh = false;
    // 重置分页
    out_vote_list_config.page = 1;

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
  // @asyncCtrlGenerator.loading(() =>
  //   VoteListPage.getTranslate("LOADING_CAN_VOTE_LIST"),
  // )
  async initCanVoteList() {
    return this.loadCanVoteList();
  }
  @asyncCtrlGenerator.error(() =>
    VoteListPage.getTranslate("LOAD_CAN_VOTE_LIST_ERROR"),
  )
  async loadCanVoteList(refresher?: Refresher) {
    const { can_vote_list_config } = this;
    can_vote_list_config.need_refresh = false;
    // 重置分页
    can_vote_list_config.page = 1;

    const list = await this.minService.getMyVotes(
      can_vote_list_config.page,
      can_vote_list_config.pageSize,
    );
    this.can_vote_list = list;
    if (refresher) {
      refresher.complete();
    }
  }
  @asyncCtrlGenerator.error(() =>
    VoteListPage.getTranslate("LOAD_MORE_CAN_VOTE_LIST_ERROR"),
  )
  async loadMoreCanVoteList() {
    const { can_vote_list_config } = this;
    // 重置分页
    can_vote_list_config.page += 1;

    const list = await this.minService.getMyVotes(
      can_vote_list_config.page,
      can_vote_list_config.pageSize,
    );
    this.can_vote_list.push(...list);

    can_vote_list_config.has_more =
      list.length >= can_vote_list_config.pageSize;
  }
  // @asyncCtrlGenerator.loading(() =>
  //   VoteListPage.getTranslate("LOADING_IN_VOTE_LIST"),
  // )
  async initInVoteList() {
    return this.loadInVoteList();
  }
  @asyncCtrlGenerator.error(() =>
    VoteListPage.getTranslate("LOAD_IN_VOTE_LIST_ERROR"),
  )
  async loadInVoteList(refresher?: Refresher) {
    const { in_vote_list_config } = this;
    in_vote_list_config.need_refresh = false;
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
