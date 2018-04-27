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
import { AniBase, Easing } from "../components/AniBase";

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

  @FirstLevelPage.didEnter
  private _initStyleMagic() {
    if (this.content) {
      let navbarEle: HTMLElement | null = null;
      const pageEle = this.content.getNativeElement()
        .parentElement as HTMLElement;
      const t1 = pageEle.querySelectorAll("[add-navbar-height-to-padding-top]");
      if (t1.length) {
        let navbar_height = 0;
        if (!navbarEle) {
          navbarEle = pageEle.querySelector("ion-navbar");
        }
        if (navbarEle) {
          navbar_height = navbarEle.offsetHeight;
        }
        if (navbar_height) {
          for (
            let i = 0, ele: HTMLElement;
            (ele = t1[i] as HTMLElement);
            i += 1
          ) {
            if (!ele.style.paddingTop) {
              const old_padding_top =
                parseFloat(getComputedStyle(ele).paddingTop || "") || 0;
              ele.style.paddingTop = old_padding_top + navbar_height + "px";
            }
          }
        }
      }
    }
  }

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
    if (this.isIOS) {
      return; // 暂时关闭，垃圾IOS，使用touch强行让ios尽量渲染滚动，给人的感觉会反而很不好
    }
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
    if (!this.content || !this.isIOS) {
      return;
    }

    const scroll_ele = this.content.getScrollElement();
    let ts;
    scroll_ele.addEventListener("touchstart", (e: TouchEvent) => {
      ts = e.touches[0].clientY;
      from = ts;
      to = from;
      from_time = performance.now();
      to_time = from_time;
    });
    let from: number;
    let from_time: number;
    let to: number;
    let to_time: number;
    let frame_id;
    let overflowScrolling = "touch";
    const from_to_max_span = 120;
    scroll_ele.addEventListener("touchmove", (e: TouchEvent) => {
      var te = e.changedTouches[0].clientY;
      if (this.content && this.PAGE_STATUS <= PAGE_STATUS.DID_ENTER) {
        const scrollTop = this.content.getScrollElement().scrollTop;
        if (scrollTop > this._watch_scroll_content_max_scrollTop) {
          if (ts > te) {
            // 向下
            overflowScrolling = "touch";
          } else {
            overflowScrolling = "touch"; //"auto";
          }
        } else {
          overflowScrolling = "auto";
        }
        this.content.setScrollElementStyle(
          "-webkit-overflow-scrolling",
          overflowScrolling,
        );

        const now = performance.now();
        /*模拟滚动*/

        from = to;
        from_time = to_time;
        to = te;
        to_time = now;

        if (frame_id) {
          this.caf(frame_id);
          frame_id = null;
        }
      }
    });
    const touchend = (e: TouchEvent) => {
      const contentEle = e.currentTarget as HTMLElement;

      if (frame_id) {
        this.caf(frame_id);
        frame_id = null;
      }
      if (overflowScrolling !== "auto") {
        return;
      }
      if (to_time == from_time) {
        return;
      }
      if (to_time - from_time > from_to_max_span) {
        return;
      }
      let source_speed = 10 * (to - from) / (to_time - from_time);
      // const dir = -source_speed / Math.abs(source_speed);
      const total_will_ani_time = source_speed * 10;
      const total_will_move = source_speed / 2 * total_will_ani_time;

      // let pre_t = performance.now();
      const start_t = performance.now();
      const from_scrollTop = contentEle.scrollTop;
      // const to_scrollTop =   contentEle.scrollTop+total_will_move;
      const scroll_handle = cur_t => {
        const dif_t = cur_t - start_t;
        const progress = Math.min(dif_t / total_will_ani_time, 1);
        const cur_scrollTop =
          from_scrollTop + Easing.Circular_In(progress) * total_will_move;
        if (isNaN(cur_scrollTop)) {
          return;
        }
        contentEle.scrollTop = cur_scrollTop;

        if (progress < 1) {
          frame_id = this.raf(scroll_handle);
        }
      };
      frame_id = this.raf(scroll_handle);
    };
    // scroll_ele.addEventListener("touchend", touchend);
    // scroll_ele.addEventListener("touchcancel", touchend);
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
  _progress_ani_duration = 250;
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
    //   this.raf(calcScrollTopInTime);
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
          const _navbar_ani_height =
            navbar_ele && navbar_ele.getAttribute("navbar-ani-height");
          const navbar_height =
            (_navbar_ani_height
              ? parseFloat(_navbar_ani_height)
              : navbar_ele && navbar_ele.offsetHeight) || 0;
          const cTop = this.content._cTop;
          const _header_ani_height = header_ele.getAttribute(
            "header-ani-height",
          );
          const header_height =
            (_header_ani_height
              ? parseFloat(_header_ani_height)
              : header_ele.offsetHeight) || 0;
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
          ani_from_to,
        } = this._header_progress_ani_data;

        const scrollTop = Math.min(scrollEvent.scrollTop, distance);
        const process = scrollTop / distance;

        if (process === pre_scroll_process) {
          return;
        }
        this.tryEmit("header-ani-progress", process);
        this._header_progress_ani_data.pre_scroll_process = process;

        let _to = process;
        // 省电模式下，关闭跟随动画
        if (this.appSetting.settings.power_saving_mode) {
          _to = Math.round(_to);
          const new_ani_from_to = "TO:" + _to;
          if (new_ani_from_to !== ani_from_to) {
            this._header_progress_ani_data.ani_from_to = new_ani_from_to;
            if (this._header_progress_ani_data.abort) {
              this._header_progress_ani_data.abort();
              this._header_progress_ani_data.abort = null;
            }

            const header_ele = this.header.getNativeElement();

            // if (_to === 1) {
            //   this.header.setElementStyle("animation-direction", "normal");
            // } else {
            //   this.header.setElementStyle("animation-direction", "reverse");
            // }
            // this.header.setElementStyle(
            //   "animation-duration",
            //   this._progress_ani_duration + "ms",
            // );
            // this.header.setElementStyle("animation-play-state", "running");
            // this.header.setElementStyle("animation-iteration-count", "1");
            // this.header.setElementStyle("animation-fill-mode", "forwards");
            // this.fixIOSCacheBug(this.header.getNativeElement());

            // const ti = setTimeout(() => {
            //   this._header_progress_ani_data.abort = null;
            //   this.header &&
            //     this.header.setElementStyle("animation-play-state", "paused");
            // }, this._progress_ani_duration);
            // this._header_progress_ani_data.abort = () => {
            //   this._header_progress_ani_data.abort = null;
            //   clearTimeout(ti);
            // };

            AniBase.animateNumber(
              this._header_progress_ani_data.ani_v || 0,
              _to === 1 ? _to - 0.00001 : _to,
              this._progress_ani_duration,
            )(
              (v, abort) => {
                this._header_progress_ani_data.ani_v = v;
                this._header_progress_ani_data.abort = abort;
                const to = -v;

                let cur_dealy = to * ani_total_second;
                if (process === 1) {
                  cur_dealy += 0.0001;
                }
                this.header &&
                  this.setElementAnimateDelay(
                    this.header.getNativeElement(),
                    cur_dealy,
                  );
              },
              () => {
                this._header_progress_ani_data.abort = null;
              },
            );
          }
        } else {
          // 根据高度实时响应
          let cur_dealy = -process * ani_total_second;
          if (process === 1) {
            cur_dealy += 0.0001;
          }
          this.setElementAnimateDelay(
            this.header.getNativeElement(),
            cur_dealy,
          );
        }

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
        this.setElementAnimateDelay(this.header.getNativeElement(), null);
        this.content.setScrollElementStyle("transform", null);
      }
    });
  }
  _fuck_ios_bug_placeholder_ele = document.createComment(
    this.cname + " header placeholder",
  );
  setElementAnimateDelay(ele: HTMLElement, second?: number | null) {
    if (typeof second === "number") {
      ele.style.animationDelay = second + "s";
    } else {
      ele.style.animationDelay = "";
    }
    this.fixIOSCacheBug(ele);
  }
  fixIOSCacheBug(ele: HTMLElement) {
    if (this.isIOS) {
      this.fixIOSCacheBug = (ele: HTMLElement) => {
        if (this.PAGE_STATUS === PAGE_STATUS.DID_ENTER) {
          const parent = ele.parentElement as HTMLElement;
          const placeholder_ele = this._fuck_ios_bug_placeholder_ele;
          parent.replaceChild(placeholder_ele, ele);
          parent.replaceChild(ele, placeholder_ele);
        }
      };
    } else {
      this.fixIOSCacheBug = () => {};
    }
    this.fixIOSCacheBug(ele);
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

  @FirstLevelPage.autoUnsubscribe() private _token_subscription?: Subscription;
  /**通用的高度监控*/
  @FirstLevelPage.autoUnsubscribe() private _height_subscription?: Subscription;
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
    this._height_subscription = this.appSetting.after_height.subscribe(
      height => {
        this.dispatchEvent("HEIGHT:CHANGED", height, is_first);
        is_first = false;
      },
    );
  }
  /**通用的轮次监控*/
  @FirstLevelPage.autoUnsubscribe() private _round_subscription?: Subscription;
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
    this._round_subscription = this.appSetting.after_round.subscribe(round => {
      this.dispatchEvent("ROUND:CHANGED", round, is_first);
      is_first = false;
    });
  }
}
