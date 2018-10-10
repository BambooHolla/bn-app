import { Animation } from "ionic-angular/animations/animation";
import { isPresent } from "ionic-angular/util/util";
import { PageTransition } from "ionic-angular/transitions/page-transition";
import { ViewController } from "ionic-angular/navigation/view-controller";
import { ElementRef } from "@angular/core";

const DURATION = 500;
const CLIP_PATH = "-webkit-clip-path";
const SHOW_BACK_BTN_CSS = "show-back-button";
const POP_SYMBOL = Symbol.for("nav.pop");

function getTouchPosAndCircleR(view: ViewController) {
  const W = document.body.clientWidth;
  const H = document.body.clientHeight;
  const touchPos: {
    x: number;
    y: number;
  } = view.getNavParams().get("touchPos") || {
    x: W / 2,
    y: H / 2,
  };
  const right = W - touchPos.x;
  const bottom = H - touchPos.y;
  const max_x = Math.max(right, touchPos.x);
  const max_y = Math.max(bottom, touchPos.y);
  const R = Math.sqrt(max_x * max_x + max_y * max_y);

  return {
    touchPos,
    circleR: R
  }
}

export class RippleTransition extends PageTransition {
  init() {
    super.init();

    const enteringView = this.enteringView;
    const leavingView = this.leavingView;

    const opts = this.opts;

    this.duration(opts.duration && isPresent(opts.duration) ? opts.duration : DURATION);
    this.easing('')


    const backDirection = opts.direction === "back";

    if (enteringView) {

      const enteringPageEle: HTMLElement = enteringView.pageRef().nativeElement;

      const enteringContent = new Animation(this.plt, enteringPageEle);
      const enteringBackButton = new Animation(this.plt,
        enteringPageEle.querySelector("ion-navbar .back-button")
      );
      this.add(enteringContent);
      this.add(enteringBackButton);
      enteringBackButton.beforeAddClass(SHOW_BACK_BTN_CSS);

      if (backDirection) {
      } else {
        // 前进模式

        const { touchPos, circleR } = getTouchPosAndCircleR(enteringView);
        enteringContent.fromTo(CLIP_PATH, `circle(0% at ${touchPos.x}px ${touchPos.y}px)`, `circle(${circleR}px at ${touchPos.x}px ${touchPos.y}px)`, true);

        // 改写pop
        if (!enteringView._nav[POP_SYMBOL]) {
          enteringView._nav[POP_SYMBOL] = enteringView._nav.pop;
        }
        enteringView._nav.pop = (opts?, done?) => {
          opts = Object.assign({
            animation: "ripple-transition",
            duration: this.getDuration(),
          }, opts);
          return enteringView._nav[POP_SYMBOL](opts, done);
        }
      }
    }

    if (leavingView && leavingView.pageRef()) {
      const leavingPageEle: HTMLElement = leavingView.pageRef().nativeElement;

      const leavingContent = new Animation(this.plt, leavingPageEle);
      const leavingBackButton = new Animation(this.plt,
        leavingPageEle.querySelector("ion-navbar .back-button")
      );
      this.add(leavingContent);
      this.add(leavingBackButton);
      leavingBackButton.beforeRemoveClass(SHOW_BACK_BTN_CSS);

      if (backDirection) {
        // 返回模式

        const { touchPos, circleR } = getTouchPosAndCircleR(enteringView);

        leavingContent.fromTo(CLIP_PATH, `circle(${circleR}px at ${touchPos.x}px ${touchPos.y}px)`, `circle(0% at ${touchPos.x}px ${touchPos.y}px)`, true);
      }
    }
  }
}

function getPageContentRef(page: ViewController) {
  if (page["_top_ion_content_element_ref"]) {
    return page["_top_ion_content_element_ref"];
  }
  const pageEle = page.pageRef().nativeElement as HTMLElement;
  var c_ele = pageEle.firstElementChild;
  while (c_ele) {
    if (c_ele.tagName.toUpperCase() === "ION-CONTENT") {
      return (page["_top_ion_content_element_ref"] = new ElementRef(c_ele));
    }
    c_ele = c_ele.nextElementSibling;
  }
  return page.contentRef();
}
