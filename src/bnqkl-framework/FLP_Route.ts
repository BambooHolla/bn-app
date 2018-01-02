import { FLP_Lifecycle } from "./FLP_Lifecycle";
import {
  NavController,
  NavOptions,
  NavParams,
  ViewController,
} from "ionic-angular";
import { asyncCtrlGenerator } from "./Decorator";
import { AccountServiceProvider } from "../providers/account-service/account-service";
import { IframepagePage } from "../pages/iframepage/iframepage";
import { PAGE_STATUS } from "./const";

export class FLP_Route extends FLP_Lifecycle {
  constructor(public navCtrl: NavController, public navParams: NavParams) {
    super();
  }
  _navCtrlPush(path: string, params?: any, opts?: NavOptions, done?: any) {
    return this.navCtrl.push(path, params, opts, done);
  }
  @FLP_Route.FromGlobal accountService: AccountServiceProvider;

  /** 路由loading显示与否的控制器 */
  hide_jump_loading = true;
  current_routeTo_page = "";

  static jump_loading_message = {
    msg: "",
    toString() {
      return this.msg;
    },
  };
  static jump_error_title = {
    title: "",
    toString() {
      return this.title;
    },
  };

  setNavParams(key: string, val: any) {
    this.navParams.data[key] = val;
  }
  // JOB模式
  // 页面A为了实现某个任务，打开页面B
  // 页面B完成任务后，返回页面A，触发任务完成的回调
  // 这个流程相关的API
  viewCtrl: ViewController;
  finishJob(
    remove_view_after_finish: boolean = this.navParams.get("auto_return") ||
      this.navParams.get("remove_view_after_finish"),
    time: number = this.navParams.get("auto_return_time"),
  ) {
    this.navParams.data["is_finish_job"] = true;
    if (remove_view_after_finish) {
      time = time | 0 || 500;
      setTimeout(() => {
        const viewCtrl = this.viewCtrl;
        if (viewCtrl) {
          this.navCtrl.removeView(this.viewCtrl);
        } else {
          console.warn(
            "使用remove_view_after_finish必须注入viewCtrl: ViewController对象",
          );
          this.PAGE_STATUS === PAGE_STATUS.DID_ENTER && this.navCtrl.pop();
        }
      }, time);
      return true;
    }
    return false;
  }
  @FLP_Route.didLeave
  private _doAfterFinishJob() {
    // 检查页面退出后要做的事情，从上一级页面传下来的
    if (this.navParams.get("is_finish_job")) {
      const after_finish_job = this.navParams.get("after_finish_job");
      if (after_finish_job instanceof Function) {
        after_finish_job();
      }
    }
  }

  /** 页面跳转专用的核心函数
   *  内置了跳转拦截的功能，需要通过registerRouteToBeforeCheck来注册拦截检测器
   */
  routeTo(path: string, ...args: any[]): Promise<any>;
  @asyncCtrlGenerator.loading(
    FLP_Route.jump_loading_message,
    "hide_jump_loading",
    {
      showBackdrop: false,
      cssClass: "can-tap",
    },
  )
  @asyncCtrlGenerator.error(FLP_Route.jump_error_title)
  async routeTo(path: string, params?: any, opts?: any, force = false) {
    if (this.current_routeTo_page === path && !force) {
      // 禁止重复点击
      return;
    }
    try {
      this.current_routeTo_page = path;
      // 参数重置
      this.hide_jump_loading = true;
      FLP_Route.jump_loading_message.msg = "请稍候";
      FLP_Route.jump_error_title.title = "页面切换异常";
      // 开始执行
      const checkInfo = await FLP_Route.doRouteToBeforeCheck(
        this,
        path,
        params,
        opts,
      );
      if (checkInfo.preventDefault) {
        console.log("页面发生重定向");
        return;
      }
      params = Object.assign(checkInfo.to_next_params, params);
      return await this._navCtrlPush(path, params, opts);
    } finally {
      this.current_routeTo_page = "";
    }
  }
  async routeToThenElse(condition, then_path, else_path) {
    if (condition instanceof Promise) {
      condition = await condition;
    }
    const path = condition ? then_path : else_path;
    if (path instanceof Array) {
      this.routeTo(path[0], path[1], path[2]);
    } else {
      this.routeTo(path);
    }
  }

  // @FLP_Route.FromNavParams ignore_check_set_real_info: string;
  static registerRouteToBeforeCheck(
    match: string | string[] | RouteToBeforeCheck_Match,
    checker: RouteToBeforeCheck_Checker,
    weight = 0,
    name?: string,
  ) {
    if (typeof match === "string") {
      const match_path = match;
      match = path => match_path === path;
    }
    if (match instanceof Array) {
      const match_paths = match;
      match = path => match_paths.indexOf(path) !== -1;
    }
    this.ROUTE_TO_BEFORE_CHECK_LIST.push({
      name,
      match,
      checker,
      weight,
    });
    this.ROUTE_TO_BEFORE_CHECK_LIST.sort((a, b) => a.weight - b.weight);
  }
  static ROUTE_TO_BEFORE_CHECK_LIST: Array<RouteToBeforeCheck> = [];
  static async doRouteToBeforeCheck(
    self: FLP_Route,
    path: string,
    params?: any,
    opts?: any,
  ) {
    const to_next_params = {};
    let preventDefault = false;
    for (
      var i = 0, C: RouteToBeforeCheck;
      (C = this.ROUTE_TO_BEFORE_CHECK_LIST[i]);
      i += 1
    ) {
      const check_label = `CHECK ${i + 1}:${C.name || "NO-NAME"}`;
      console.time(check_label);
      if (C.match(path, params, opts)) {
        if (
          await C.checker(self, to_next_params, {
            path,
            params,
            opts,
          })
        ) {
          i = Infinity;
          preventDefault = true;
        }
      }
      console.timeEnd(check_label);
    }
    return {
      preventDefault,
      to_next_params,
    };
  }

  /**
   * 智能跳转，尝试使用pop，如果是上一级的页面
   */
  smartRouteTo(path?: string, params?: any, opts?: NavOptions) {
    const views = this.navCtrl.getViews();
    const pre_view = views[views.length - 2];
    if (pre_view.id === path) {
      Object.assign(pre_view.getNavParams().data, params);
      return this.navCtrl.pop();
    } else {
      return this.routeTo(path, params, opts);
    }
  }
  /**
   * 重定向页面
   */
  setRedirectUrl(
    redirect_url,
    title?: string,
    options?: {
      auto_close_when_redirect?: boolean;
      navbar_color?: string;
      after_nav_pop?: () => void;
    },
  ) {
    // this.redirect_url = this.sanitizer.bypassSecurityTrustResourceUrl(redirect_url);
    if (localStorage.getItem("disabled-iframe")) {
      navigator["clipboard"].writeText(redirect_url);
      return;
    }
    this.modalCtrl
      .create(
        IframepagePage,
        Object.assign(
          {
            title,
            // 地址
            redirect_url,
            // 在第三方iframe页面加载出来后要显示给用户的提示
            load_toast: "", //"操作完成后请点击左上角的返回按钮"
            // 在第三方页面进行再跳转的时候，强制关闭页面
            auto_close_when_redirect: true,
          },
          options,
        ),
      )
      .present();
  }
}

FLP_Route.registerRouteToBeforeCheck(
  [
    "roll-out",
    "buy-in",
    "bind-credit-card",
    "plan-add-wages-mission",
    "plan-add-interest-mission",
  ],
  async (self, to_next_params, { path, params, opts }) => {
    self.hide_jump_loading = false; // 在await前，设置这个属性，让loading显示
    FLP_Route.jump_loading_message.msg = "检测实名认证"; //修改LOGIN显示的信息
    FLP_Route.jump_error_title.title = "实名认证检测异常";
    const real_info = await self.accountService.realInfo.getPromise();
    console.log("real_info", real_info);
    if (real_info && real_info.status === "101") {
      // 认证通过
      // // 告知下一级的页面不用再检查是否设置过实名认证了
      // to_next_params.ignore_check_set_real_info = true;
    } else {
      self._navCtrlPush("real-info", {
        remove_view_after_finish: true,
        after_finish_job: () => {
          self.routeTo(path, params, opts);
        },
      });
      return true;
    }
  },
  0,
  "实名认证检测",
);
FLP_Route.registerRouteToBeforeCheck(
  ["buy-in", "roll-out", "plan-add-wages-mission", "plan-add-interest-mission"],
  async (self, to_next_params, { path, params, opts }) => {
    const bank_list = await self.accountService.bankcards.getPromise();
    if (!bank_list.length) {
      self._navCtrlPush("bind-credit-card", {
        remove_view_after_finish: true,
        after_finish_job: () => {
          self.routeTo(path, params, opts);
        },
      });
      return true;
    }
  },
  1,
  "检测银行卡绑定",
);

FLP_Route.registerRouteToBeforeCheck(
  ["buy-in", "roll-out", "plan-add-wages-mission", "plan-add-interest-mission"],
  async (self, to_next_params, { path, params, opts }) => {
    const is_settd_pay_pwd = await self.accountService.isSettedPayPWD.getPromise();
    console.log("is_settd_pay_pwd", is_settd_pay_pwd);
    if (!is_settd_pay_pwd) {
      self._navCtrlPush("set-pay-pwd", {
        remove_view_after_finish: true,
        after_finish_job: () => {
          self.routeTo(path, params, opts);
        },
      });

      return true;
    }
  },
  2,
  "检测支付密码是否已经设置",
);
FLP_Route.registerRouteToBeforeCheck(
  ["buy-in", "plan-add-wages-mission", "plan-add-interest-mission"],
  async (self, to_next_params, { path, params, opts }) => {
    const is_withhold_authority = await self.accountService.isWithholdAuthority.getPromise();
    if (!is_withhold_authority) {
      const goWithholdAuthority = () =>
        self._navCtrlPush("account-withhold-authorize", {
          remove_view_after_finish: true,
          after_finish_job: () => {
            self.routeTo(path, params, opts);
          },
        });
      self.alertCtrl
        .create(
          Object.assign({
            title: "授权请求",
            subTitle: "请授权“委托余额扣款”<br>来确保买入流程的进行",
            buttons: [
              "取消",
              {
                text: "去授权",
                handler: goWithholdAuthority,
              },
            ],
          }),
        )
        .present();
      return true;
    }
  },
  3,
  "检测委托扣款协议",
);
FLP_Route.registerRouteToBeforeCheck(
  ["bind-credit-card"],
  async (self, to_next_params, { path, params, opts }) => {
    const bankcards = await self.accountService.bankcards.getPromise();
    if (bankcards.length) {
      self.alertCtrl
        .create({
          title: "您已经绑定过银行卡",
          subTitle: "不需要绑定额外的银行卡，如果有需要，请先解除绑定旧卡",
          buttons: [
            "知道了",
            {
              text: "去解绑",
              handler: () => {
                if (self.viewCtrl && self.viewCtrl.id === "my-credit-cards") {
                  // 在当前页面，不需要跳转
                  self["openUnbindCardSlide"]();
                } else {
                  self.routeTo("my-credit-cards", {
                    open_unbind_card_slide: true,
                  });
                }
              },
            },
          ],
        })
        .present();
      return true;
    }
  },
);
type RouteToBeforeCheck = {
  name: string;
  match: RouteToBeforeCheck_Match;
  checker: RouteToBeforeCheck_Checker;
  weight: number;
};
type RouteToBeforeCheck_Match = (
  path: string,
  params?: any,
  opts?: any,
) => boolean;
type RouteToBeforeCheck_Checker = (
  self: FLP_Route,
  to_next_params: any,
  route_to_args: {
    path: string;
    params?: any;
    opts?: any;
  },
) => Promise<undefined | boolean> | undefined | boolean;
