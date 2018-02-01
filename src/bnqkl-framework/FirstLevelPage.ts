import { ViewChild } from "@angular/core";
import {
  NavController,
  NavParams,
  ToolbarTitle,
  Header,
  Content,
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
      return
    }
    this.content.ionScroll.subscribe(() => {
      if (!this.content || !this.header) {
        return
      }
      if (this.auto_header_shadow_when_scroll_down) {
        const {
          from_color,
          to_color,
          distance,
          blur_rem,
          pre_scroll_process,
        } = this.header_shadow_config;
        const process = Math.min(this.content.scrollTop / distance, 1);
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
}
