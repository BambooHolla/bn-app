import { Animation } from "ionic-angular/animations/animation";
import { isPresent } from "ionic-angular/util/util";
import { PageTransition } from "ionic-angular/transitions/page-transition";
import { ViewController } from "ionic-angular/navigation/view-controller";
import { ElementRef } from "@angular/core";

const DURATION = 500;
const WIDTH = "width";
const HEIGHT = "height";
const BORDER_RADIUS = "border-radius";
const SIZE_NONE = "0vmax";
const SIZE_FULL = "100vmax";

export class RippleTransition extends PageTransition {
  init() {
    super.init();

    const enteringView = this.enteringView;
    const leavingView = this.leavingView;

    const opts = this.opts;

    console.log(opts);

    this.duration(opts.duration && isPresent(opts.duration) ? opts.duration : DURATION);

    const backDirection = opts.direction === "back";
    const baseStyle = {
      transformOrigin: "center",
      maxWidth: "100vw",
      boxShadow: "0 0 1rem rgba(0,0,0,0.3)",
    };

    if (enteringView) {
      const enteringPageEle: HTMLElement = enteringView.pageRef().nativeElement;

      const enteringContent = new Animation(this.plt, enteringPageEle);
      this.add(enteringContent);

      if (backDirection) {
      } else {
        // 前进模式
        enteringContent.beforeStyles({ borderRadius: SIZE_FULL, ...baseStyle });

        const touchPos: { x: number; y: number } | undefined = enteringView.getNavParams().get("touchPos");
        if (touchPos) {
          enteringContent.beforeStyles({
            transformOrigin: `${touchPos.x}px ${touchPos.y}px`,
            // position: "absolute",
            // left: `${touchPos.x}px`,
            // top: `${touchPos.y}px`,
          });
          enteringContent.fromTo("transform", `translateX(0px) translateY(0px);`, ` translateX(${-touchPos.x}px) translateY(${-touchPos.y}px)`, false);
        }
        enteringContent.fromTo(WIDTH, SIZE_NONE, SIZE_FULL, true);
        enteringContent.fromTo(HEIGHT, SIZE_NONE, SIZE_FULL, true);
        enteringContent.fromTo(BORDER_RADIUS, SIZE_FULL, SIZE_NONE, true);
      }
    }

    if (leavingView && leavingView.pageRef()) {
      const leavingPageEle: HTMLElement = leavingView.pageRef().nativeElement;

      const leavingContent = new Animation(this.plt, leavingPageEle);
      this.add(leavingContent);

      if (backDirection) {
        // 返回模式
        leavingContent.beforeStyles({ borderRadius: SIZE_NONE, ...baseStyle });

        const touchPos: { x: number; y: number } | undefined = enteringView.getNavParams().get("touchPos");
        if (touchPos) {
          leavingContent.beforeStyles({
            transformOrigin: `${touchPos.x}px ${touchPos.y}px`,
            // position: "absolute",
            // left: `${touchPos.x}px`,
            // top: `${touchPos.y}px`,
          });
          leavingContent.fromTo("transform", ` translateX(${-touchPos.x}px) translateY(${-touchPos.y}px)`, `translateX(0px) translateY(0px);`, false);
        }
        leavingContent.fromTo(WIDTH, SIZE_FULL, SIZE_NONE, true);
        leavingContent.fromTo(HEIGHT, SIZE_FULL, SIZE_NONE, true);
        leavingContent.fromTo(BORDER_RADIUS, SIZE_NONE, SIZE_FULL, true);
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
