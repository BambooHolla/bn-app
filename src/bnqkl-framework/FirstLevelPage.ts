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

export class FirstLevelPage extends FLP_Data {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams, // @Inject(AlertController) alertCtrl: AlertController,
  ) {
    super(navCtrl, navParams);
  }
  @ViewChild(ToolbarTitle) title: ToolbarTitle;
  @ViewChild(Header) header: Header;
  @ViewChild(Content) content: Content;

  // 启用实验性的backdropFilter功能
  @FirstLevelPage.didEnter
  private _initBackdropFilter() {
    const headerEle = this.header.getNativeElement() as HTMLElement;

    if (this.toBool(headerEle.dataset.canBackdropFilter)) {
      const contentFixedEle = this.content.getFixedElement();
      const contentScrollEle = this.content.getScrollElement();
      if (contentFixedEle.style.marginTop) {
        contentScrollEle.style.paddingTop = contentFixedEle.style.marginTop;
        contentScrollEle.style.marginTop = "";
      }
    }
  }

  private _title_ti: number;
  // 强行修复ionic Title显示的BUG
  @FirstLevelPage.didEnter
  private _fixIonicDocumentTitleBug_didEnter() {
    if (this.PAGE_LEVEL === 1) {
      this._title_ti = this.platform.raf(() => {
        document.title = "……"; //
        document.title = this.title.getTitleText();
      });
    }
  }
  @FirstLevelPage.didEnter
  private _fixIonicDocumentTitleBug_willLevel() {
    if (this.PAGE_LEVEL === 1) {
      // 销毁TITLE控制器
      if (this._title_ti) {
        this.platform.cancelRaf(this._title_ti);
        this._title_ti = null;
      }
    }
  }

  auto_header_shadow_when_scroll_down = false;
  header_shadow_config = {
    distance: 100, // 显示完整阴影所需的位移量
    from_color: [0, 0, 0, 0],
    to_color: [0, 0, 0, 0.3],
    blur_rem: 1,
  };

  // 页面滚动自动添加阴影
  @FirstLevelPage.onInit
  _autoAddHeaderShadowWhenScrollDown() {
    this.content.ionScroll.subscribe(() => {
      if (this.auto_header_shadow_when_scroll_down) {
        const {
          from_color,
          to_color,
          distance,
          blur_rem,
        } = this.header_shadow_config;
        const process = Math.min(this.content.scrollTop / distance, 1);
        const cur_color = from_color.map((from_v, i) => {
          const to_v = to_color[i];
          return (to_v - from_v) * process + from_v;
        });
        this.header.setElementStyle(
          "box-shadow",
          `0 0 ${blur_rem}rem rgba(${cur_color})`,
        );
      } else {
        this.header.setElementStyle("box-shadow", null);
      }
    });
  }
}
