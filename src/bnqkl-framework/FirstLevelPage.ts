import { Subscription } from "rxjs/Subscription";
import { ViewChild } from "@angular/core";
import {
  NavController,
  NavParams,
  ToolbarTitle,
  Header,
  Content,
  ScrollEvent,
} from "ionic-angular";

import { asyncCtrlGenerator } from "./Decorator";
import { PAGE_STATUS } from "./const";

import { FLP_Data } from "./FLP_Data";
import { SearchType } from "../pages/search/search.const";

export class FirstLevelPage extends FLP_Data {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams, // @Inject(AlertController) alertCtrl: AlertController,
  ) {
    super(navCtrl, navParams);
  }
  @ViewChild(ToolbarTitle) title?: ToolbarTitle;
  @ViewChild(Header) header?: Header;
  @ViewChild(Content) content?: Content;

  // 启用实验性的backdropFilter功能
  @FirstLevelPage.didEnter
  private _initBackdropFilter() {
    if (this.header) {
      const headerEle = this.header.getNativeElement() as HTMLElement;

      if (this.content && this.toBool(headerEle.dataset.canBackdropFilter)) {
        const contentFixedEle = this.content.getFixedElement();
        const contentScrollEle = this.content.getScrollElement();
        if (contentFixedEle.style.marginTop) {
          contentScrollEle.style.paddingTop = contentFixedEle.style.marginTop;
          contentScrollEle.style.marginTop = "";
        }
      }
    }
  }

  private _title_ti?: number;
  // 强行修复ionic Title显示的BUG
  @FirstLevelPage.didEnter
  private _fixIonicDocumentTitleBug_didEnter() {
    if (this.PAGE_LEVEL === 1) {
      this._title_ti = this.platform.raf(() => {
        document.title = "……"; //
        document.title = this.title && this.title.getTitleText();
      });
    }
  }
  @FirstLevelPage.didEnter
  private _fixIonicDocumentTitleBug_willLevel() {
    if (this.PAGE_LEVEL === 1) {
      // 销毁TITLE控制器
      if (this._title_ti) {
        this.platform.cancelRaf(this._title_ti);
        this._title_ti = undefined;
      }
    }
  }

  private _has_watch_scroll_content_intime = false;
  private _watch_scroll_content_max_scrollTop = 0;
  private _watch_scroll_content_intime(distance?: number) {
    if (this._has_watch_scroll_content_intime) {
      if (distance) {
        this._watch_scroll_content_max_scrollTop = Math.max(
          this._watch_scroll_content_max_scrollTop,
          distance,
        );
      }
      return;
    }
    this._watch_scroll_content_max_scrollTop = distance || window.innerHeight;
    if (this.content && this.isIOS) {
      const scroll_ele = this.content.getScrollElement();
      let ts;
      scroll_ele.addEventListener("touchstart", e => {
        ts = e.touches[0].clientY;
        from = ts;
      });
      let from: number;
      let to: number;
      let frame_id;
      let overflowScrolling = "touch";
      scroll_ele.addEventListener("touchmove", e => {
        var te = e.changedTouches[0].clientY;
        if (this.content && this.PAGE_STATUS <= PAGE_STATUS.DID_ENTER) {
          const scrollTop = this.content.getScrollElement().scrollTop;
          if (scrollTop > this._watch_scroll_content_max_scrollTop) {
            if (ts > te) {
              overflowScrolling = "touch";
            } else {
              overflowScrolling = "auto";
            }
          } else {
            overflowScrolling = "auto";
          }
          this.content.setScrollElementStyle(
            "-webkit-overflow-scrolling",
            overflowScrolling,
          );

          /*模拟滚动*/
          if (to !== undefined) {
            from = to;
          }
          to = te;

          if (frame_id) {
            cancelAnimationFrame(frame_id);
            frame_id = null;
          }
        }
      });
      const touchend = (e: TouchEvent) => {
        const contentEle = e.currentTarget as HTMLElement;

        if (frame_id) {
          cancelAnimationFrame(frame_id);
          frame_id = null;
        }
        if (overflowScrolling !== "auto") {
          return;
        }
        let diff = (from - to) / window.devicePixelRatio;
        let total_diff = diff;
        const scroll_handle = () => {
          // this.header && (this.header.getNativeElement().querySelector(".toolbar-title").innerHTML = diff + "px");
          contentEle.scrollTop += diff * window.devicePixelRatio;
          // diff /= 2;
          const cut_diff = total_diff / Math.max(2, Math.abs(diff) / 2);
          if (diff > 0) {
            diff -= Math.min(cut_diff, diff / 2);
          } else {
            diff -= Math.max(cut_diff, diff / 2);
          }
          if (Math.abs(diff) > 0.5) {
            frame_id = requestAnimationFrame(scroll_handle);
          }
        };
        frame_id = requestAnimationFrame(scroll_handle);
      };
      scroll_ele.addEventListener("touchend", touchend);
      scroll_ele.addEventListener("touchcancel", touchend);
    }
    // const calcScrollTopInTime = () => {
    //   if (this.PAGE_STATUS <= PAGE_STATUS.DID_ENTER) {
    //     this.content && this.content.getScrollElement().scrollTop;
    //     if (this.header) {
    //       const navbar_ele = (this.header.getNativeElement() as HTMLElement).querySelector(
    //         "ion-navbar",
    //       ) as HTMLElement | null;
    //       if (navbar_ele) {
    //         navbar_ele.innerHTML =
    //           (this.content && this.content.getScrollElement().scrollTop) +
    //           "px" +
    //           window.pageYOffset;
    //       }
    //     }
    //   }
    //   requestAnimationFrame(calcScrollTopInTime);
    // };
    // calcScrollTopInTime();
  }

  auto_header_shadow_when_scroll_down = false;
  header_shadow_config = {
    distance: 100, // 显示完整阴影所需的位移量
    from_color: [0, 0, 0, 0],
    to_color: [0, 0, 0, 0.3],
    blur_rem: 1,
    pre_scroll_process: 0,
  };

  /**页面滚动自动添加阴影*/
  @FirstLevelPage.onInit
  _autoAddHeaderShadowWhenScrollDown() {
    if (!this.content) {
      return;
    }
    this._watch_scroll_content_intime(this.header_shadow_config.distance);
    this.content.ionScroll.subscribe((scrollEvent: ScrollEvent) => {
      if (!this.content || !this.header) {
        return;
      }
      if (this.auto_header_shadow_when_scroll_down) {
        const {
          from_color,
          to_color,
          distance,
          blur_rem,
          pre_scroll_process,
        } = this.header_shadow_config;
        const process = Math.min(scrollEvent.scrollTop / distance, 1);
        if (process === pre_scroll_process) {
          return;
        }
        this.header_shadow_config.pre_scroll_process = process;

        let cur_color;
        if (process === 0) {
          cur_color = from_color;
        } else if (process === 1) {
          cur_color = to_color;
        } else {
          cur_color = from_color.map((from_v, i) => {
            const to_v = to_color[i];
            return (to_v - from_v) * process + from_v;
          });
        }
        this.header.setElementStyle(
          "box-shadow",
          `0 0 ${blur_rem}rem rgba(${cur_color})`,
        );
      } else {
        (this.header.setElementStyle as any)("box-shadow", null);
      }
    });
  }

  auto_header_progress_when_scrol_down = false;
  _header_progress_ani_data: any = null;
  /**页面滚动自动设置滚动动画进度*/
  @FirstLevelPage.onInit
  _autoSetHeaderAniProgressWhenScrollDown() {
    if (!this.content) {
      return;
    }
    this._watch_scroll_content_intime();
    // const calcScrollTopInTime = () => {
    //   if (this.PAGE_STATUS <= PAGE_STATUS.DID_ENTER) {
    //     // this.content && this.content.getScrollElement().scrollTop;
    //   }
    //   requestAnimationFrame(calcScrollTopInTime);
    // };
    // calcScrollTopInTime();
    this.content.ionScroll.subscribe((scrollEvent: ScrollEvent) => {
      if (!this.content || !this.header) {
        return;
      }
      if (this.auto_header_progress_when_scrol_down) {
        if (!this._header_progress_ani_data) {
          const header_ele = this.header.getElementRef()
            .nativeElement as HTMLElement;
          const header_style = getComputedStyle(header_ele);
          const scroll_content_height = this.content.getScrollElement()
            .offsetHeight;

          const navbar_ele = header_ele.querySelector(
            "ion-navbar",
          ) as HTMLElement | null;
          const navbar_height = navbar_ele ? navbar_ele.offsetHeight : 0;
          const cTop = this.content._cTop;
          const header_height = header_ele.offsetHeight;
          const distance = header_height - navbar_height;
          this._watch_scroll_content_intime(distance);

          const ani_total_second = parseFloat(
            header_style.animationDuration || "0s",
          );
          this._header_progress_ani_data = {
            header_ele,
            header_style,
            cTop,
            header_height,
            scroll_content_height,
            navbar_ele,
            navbar_height,
            distance,
            ani_total_second,
            pre_scroll_process: 0,
          };
          this.content.setScrollElementStyle(
            "height",
            `${scroll_content_height + distance}px`,
          );
        }
        const {
          header_ele,
          header_style,
          cTop,
          header_height,
          scroll_content_height,
          navbar_ele,
          navbar_height,
          distance,
          ani_total_second,
          pre_scroll_process,
        } = this._header_progress_ani_data;

        const scrollTop = Math.min(scrollEvent.scrollTop, distance);
        const process = scrollTop / distance;

        if (process === pre_scroll_process) {
          return;
        }
        this.tryEmit("header-ani-progress", process);
        this._header_progress_ani_data.pre_scroll_process = process;

        let cur_dealy = -process * ani_total_second;
        if (process === 1) {
          cur_dealy += 0.0001;
        }
        this.header.setElementStyle("animation-delay", `${cur_dealy}s`);
        this.content.setScrollElementStyle(
          "transform",
          `translateY(${-scrollTop}px)`,
        );
        /* IONIC的content组件使用contentTop来判定是否更新marginTop，由于header高度变动.
         * 我们使用translateY来模拟marginTop变动
         * 所以在页面更新切换更新的时候，不需要去判定header高度的变动*/
        const diff_offset_height = header_height - header_ele.offsetHeight;
        this.content.contentTop = cTop - diff_offset_height;
        this.content._cTop -= diff_offset_height;
      } else {
        (this.header.setElementStyle as any)("animation-delay", null);
        this.content.setScrollElementStyle("transform", null);
      }
    });
  }

  SearchType = SearchType;
  /**弹出搜索页*/
  openSeach(search_type?: SearchType) {
    return this.modalCtrl
      .create(
        "search",
        {
          search_type,
        },
        {
          enableBackdropDismiss: true,
          showBackdrop: true,
        },
      )
      .present();
  }

  @FirstLevelPage.autoUnsubscribe private _token_subscription?: Subscription;
  /**通用的高度监控*/
  @FirstLevelPage.autoUnsubscribe private _height_subscription?: Subscription;
  @FirstLevelPage.willEnter
  __watchHeightChanged() {
    if (this._height_subscription) {
      return;
    }
    let is_first = true;
    this.appSetting.account_address.subscribe(token => {
      if (is_first) {
        // 等_height_subscription触发后再说
        this.dispatchEvent(
          "HEIGHT:CHANGED",
          this.appSetting.getHeight(),
          is_first,
        );
      }
    });
    this._height_subscription = this.appSetting.height.subscribe(height => {
      this.dispatchEvent("HEIGHT:CHANGED", height, is_first);
      is_first = false;
    });
  }
  /**通用的轮次监控*/
  @FirstLevelPage.autoUnsubscribe private _round_subscription?: Subscription;
  @FirstLevelPage.willEnter
  __watchRoundChanged() {
    if (this._round_subscription) {
      return;
    }
    let is_first = true;
    this.appSetting.account_address.subscribe(token => {
      if (is_first) {
        // 等_round_subscription触发后再说
        this.dispatchEvent(
          "ROUND:CHANGED",
          this.appSetting.getRound(),
          is_first,
        );
      }
    });
    this._round_subscription = this.appSetting.round.subscribe(round => {
      this.dispatchEvent("ROUND:CHANGED", round, is_first);
      is_first = false;
    });
  }
}
