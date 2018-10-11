import { Animation } from "ionic-angular/animations/animation";
import { isPresent } from "ionic-angular/util/util";
import { PageTransition } from "ionic-angular/transitions/page-transition";
import { ViewController } from "ionic-angular/navigation/view-controller";
import { NavController } from "ionic-angular/navigation/nav-controller";
import { ElementRef } from "@angular/core";

const DURATION = 500;
const CLIP_PATH = "-webkit-clip-path";
const SHOW_BACK_BTN_CSS = "show-back-button";
const POP_SYMBOL = Symbol("RippleTransition.nav.pop");
const BACK_ANI_SYMBOL = Symbol("RippleTransition.backAni");
const OPACITY = "opacity";
const TRANSPARENT = 0;
const OPAQUE = 1;

function getTouchPosAndCircleR(view: ViewController) {
  const W = document.body.clientWidth;
  const H = document.body.clientHeight;
  const navParams = view.getNavParams();
  const touchPos: {
    x: number;
    y: number;
  } = navParams.get("touchPos") || {
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
    circleR: R,
    isBackAni: navParams.get("register_back_animation"),
  };
}

export class RippleTransition extends PageTransition {
  init() {
    super.init();

    const enteringView = this.enteringView;
    const leavingView = this.leavingView;

    const opts = this.opts;

    this.duration(opts.duration && isPresent(opts.duration) ? opts.duration : DURATION);
    this.easing("ease-in");

    const backDirection = opts.direction === "back";

    if (enteringView) {
      const enteringPageEle: HTMLElement = enteringView.pageRef().nativeElement;

      const enteringContent = new Animation(this.plt, enteringPageEle);
      const enteringBackButton = new Animation(this.plt, enteringPageEle.querySelector("ion-navbar .back-button"));
      this.add(enteringContent);
      this.add(enteringBackButton);
      enteringBackButton.beforeAddClass(SHOW_BACK_BTN_CSS);

      if (backDirection) {
      } else {
        // 前进模式

        const { touchPos, circleR, isBackAni } = getTouchPosAndCircleR(enteringView);
        enteringContent.fromTo(CLIP_PATH, `circle(0% at ${touchPos.x}px ${touchPos.y}px)`, `circle(${circleR}px at ${touchPos.x}px ${touchPos.y}px)`, true);
        enteringContent.fromTo(OPACITY, 0.4, OPAQUE, true);

        // 改写pop
        const nav = enteringView._nav;
        let need_back_ani_views: Set<ViewController> = nav[BACK_ANI_SYMBOL];
        if (!nav[POP_SYMBOL]) {
          nav[POP_SYMBOL] = nav.pop;
          need_back_ani_views = nav[BACK_ANI_SYMBOL] = new Set<ViewController>();
          nav.pop = function(opts?, done?) {
            const leavingView = nav.getActive();
            if (need_back_ani_views.has(leavingView)) {
              need_back_ani_views.delete(leavingView);
              opts = Object.assign(
                {
                  animation: "ripple-transition",
                },
                opts
              );
            }
            return nav[POP_SYMBOL](opts, done);
          };
        }
        enteringView[BACK_ANI_SYMBOL] = isBackAni;
        if (isBackAni) {
          need_back_ani_views.add(enteringView);
        }
      }
    }

    if (leavingView && leavingView.pageRef()) {
      const leavingPageEle: HTMLElement = leavingView.pageRef().nativeElement;

      const leavingContent = new Animation(this.plt, leavingPageEle);
      const leavingBackButton = new Animation(this.plt, leavingPageEle.querySelector("ion-navbar .back-button"));
      this.add(leavingContent);
      this.add(leavingBackButton);
      leavingBackButton.beforeRemoveClass(SHOW_BACK_BTN_CSS);

      if (backDirection) {
        // 返回模式

        const { touchPos, circleR } = getTouchPosAndCircleR(leavingView);

        leavingContent.fromTo(CLIP_PATH, `circle(${circleR}px at ${touchPos.x}px ${touchPos.y}px)`, `circle(0% at ${touchPos.x}px ${touchPos.y}px)`, true);
        leavingContent.fromTo(OPACITY, OPAQUE, 0.4, true);
      }
    }
  }
}
