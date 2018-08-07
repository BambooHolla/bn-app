import { Directive, ElementRef, Input } from "@angular/core";
import { Content, Platform } from "ionic-angular";
import { Keyboard } from "@ionic-native/keyboard";
import { Subscription } from "rxjs/Subscription";

/**
 * @name KeyboardAttachDirective
 * @description
 * The `keyboardAttach` directive will cause an element to float above the
 * keyboard when the keyboard shows. Currently only supports the `ion-footer` element.
 *
 * ### Notes
 * - This directive requires [Ionic Native](https://github.com/driftyco/ionic-native)
 * and the [Ionic Keyboard Plugin](https://github.com/driftyco/ionic-plugin-keyboard).
 * - Currently only tested to work on iOS.
 * - If there is an input in your footer, you will need to set
 *   `Keyboard.disableScroll(true)`.
 *
 * @usage
 *
 * ```html
 * <ion-content #content>
 * </ion-content>
 *
 * <ion-footer [keyboardAttach]="content">
 * </ion-footer>
 * ```
 */
type Bound = {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

@Directive({
  selector: "[keyboardAttach]",
})
export class KeyboardAttachDirective {
  @Input("keyboardAttach") content!: Content;

  private onShowSubscription?: Subscription;
  private onHideSubscription?: Subscription;

  private attachTime = 0;

  constructor(
    private elementRef: ElementRef,
    private platform: Platform,
    private keyboard: Keyboard
  ) {
    if (this.platform.is("cordova")) {
      // && this.platform.is('ios')
      this.onShowSubscription = this.keyboard
        .onKeyboardShow()
        .subscribe(e => this.onShow(e));
      this.onHideSubscription = this.keyboard
        .onKeyboardHide()
        .subscribe(() => this.onHide());
    }
  }

  ngOnDestroy() {
    if (this.onShowSubscription) {
      this.onShowSubscription.unsubscribe();
    }
    if (this.onHideSubscription) {
      this.onHideSubscription.unsubscribe();
    }
  }

  private onShow(e) {
    const keyboardHeight: number =
      e.keyboardHeight || (e.detail && e.detail.keyboardHeight);
    let moveY = 0;
    console.log("onKeyboardShow", keyboardHeight);

    const contentEle: HTMLElement = this.content.getNativeElement();
    if (contentEle) {
      const inputEle = (contentEle.querySelector("input:focus") ||
        contentEle.querySelector("textarea:focus")) as HTMLElement;
      if (inputEle) {
        const handleInputEle = (inputEle: HTMLElement) => {
          let viewEle = inputEle;
          if (inputEle.dataset.keyboardViewNode) {
            viewEle =
              (contentEle.querySelector(
                "#" + inputEle.dataset.keyboardViewNode
              ) as HTMLElement) || viewEle;
          }
          /**
           * 可是元素在页面中的显示位置，默认是更接近原本自身的位置
           * top : 顶部
           * height : (self + top)/2
           * self : 尽可能存在于自身的位置，否则上移动
           * low : (self + bottom)/2
           * bottom : 底部
           */
          const viewPosition =
            inputEle.dataset.keyboardViewPosition ||
            viewEle.dataset.keyboardViewPosition ||
            "self";
          let defaultViewAlign = "top";
          switch (viewPosition) {
            case "top":
              defaultViewAlign = "top";
              break;
            case "height":
            case "self":
            case "low":
              defaultViewAlign = "middle";
              break;
            case "bottom":
              defaultViewAlign = "bottom";
              break;
            default:
              throw new Error(
                "Unkonw 'keyboardViewPosition' value:" + viewPosition
              );
          }
          /**
           * 元素的对其方式，在空间不足的情况下会触发
           * top : 对齐顶部
           * middle
           * bottom
           */
          const viewAlign =
            inputEle.dataset.keyboardViewAlign ||
            viewEle.dataset.keyboardViewAlign ||
            defaultViewAlign;
          if (
            viewAlign !== "top" &&
            viewAlign !== "middle" &&
            viewAlign !== "bottom"
          ) {
            throw new Error("Unkonw 'keyboardViewAlign' value:" + viewAlign);
          }
          // 获取view元素的transform值
          let view_translateY = 0;
          if (
            viewEle.style.transform &&
            viewEle.style.transform.indexOf("translateY") !== -1
          ) {
            const translateYMatch = viewEle.style.transform.match(
              /translateY\(([-\d]+?)px\)/
            );
            if (translateYMatch && translateYMatch[1]) {
              view_translateY = parseFloat(translateYMatch[1]) || 0;
            }
          }

          // 得出无transform的值
          const viewBound = this._getBound(viewEle, view_translateY);

          let headerHeight = 24; // 头部导航栏的高度，状态栏预留24px
          const isIgnoreHeader = this._booleanParse(
            inputEle.dataset.keyboardIgnoreIonHeader ||
              viewEle.dataset.keyboardIgnoreIonHeader ||
              false
          );
          if (!isIgnoreHeader) {
            const headerEle =
              contentEle &&
              contentEle.parentElement &&
              contentEle.parentElement.querySelector("ion-header");
            if (headerEle) {
              const headerBound = this._getBound(headerEle);
              headerHeight = headerBound.height;
            }
          }

          const MAX_MOVE_Y = Math.max(
            keyboardHeight,
            viewBound.top - headerHeight
          );
          const VIEW_HEIGHT = window.innerHeight - keyboardHeight;
          const MIN_MOVE_Y = viewBound.bottom - VIEW_HEIGHT;

          if (viewBound.bottom < VIEW_HEIGHT) {
            switch (viewPosition) {
              case "top":
                moveY = MAX_MOVE_Y;
                break;
              case "height":
                moveY = MAX_MOVE_Y / 2;
                break;
              case "self":
                moveY = 0;
                break;
              case "low":
                moveY = MIN_MOVE_Y / 2;
                break;
              case "bottom":
                moveY = MIN_MOVE_Y;
                break;
            }
          } else {
            switch (viewPosition) {
              case "top":
                moveY = MAX_MOVE_Y;
                break;
              case "height":
                moveY = (MAX_MOVE_Y + MIN_MOVE_Y) / 2;
                break;
              case "self":
              case "low":
              case "bottom":
                moveY = MIN_MOVE_Y;
                break;
            }
          }

          if (VIEW_HEIGHT < viewBound.height) {
            switch (viewAlign) {
              case "top":
                moveY = MAX_MOVE_Y;
                break;
              case "middle":
                moveY = (MAX_MOVE_Y + MIN_MOVE_Y) / 2;
                break;
              case "bottom":
                moveY = MIN_MOVE_Y;
                break;
            }
          }

          // InputEle边缘检测，取input对象的parent:ion-input
          let inputBoundEle: HTMLElement | null | undefined;
          if (inputEle.classList.contains("mat-input-element")) {
            inputBoundEle = inputEle!.parentElement!.parentElement!
              .parentElement!.parentElement as HTMLElement;
            if (inputBoundEle.tagName !== "MAT-FORM-FIELD") {
              //Angular Material <mat-form-field>
              inputBoundEle = null;
            }
          }
          if (!inputBoundEle) {
            inputBoundEle =
              inputEle.tagName === "INPUT" ? inputEle.parentElement : inputEle;
          }

          const inputBound = this._getBound(
            inputBoundEle || inputEle,
            view_translateY
          );
          if (inputEle.dataset) {
          }

          // 检测底部
          const input_moved_bottom = inputBound.bottom - moveY;
          if (input_moved_bottom > VIEW_HEIGHT) {
            // 如果在这种模式下，Input的底部看不到的了，强行显示底部
            moveY += input_moved_bottom - VIEW_HEIGHT;
          } else {
            // 检测顶部
            const input_moved_top = inputBound.top - moveY;
            if (input_moved_top < headerHeight) {
              moveY -= headerHeight - input_moved_top;
            }
          }

          const moveNodeId =
            inputEle.dataset.keyboardMoveNode ||
            viewEle.dataset.keyboardMoveNode;
          const moveNode =
            <HTMLElement>(
              (moveNodeId && contentEle.querySelector("#" + moveNodeId))
            ) || contentEle;

          moveNode.classList.add("keyboard-focus");
          this._setElementPosition(keyboardHeight, moveY, moveNode);
          // 监听键盘隐藏事件来回收元素位置
          const hideKeyBoard = () => {
            contentEle.removeEventListener("hideKeyBoard", hideKeyBoard);

            moveNode.classList.remove("keyboard-focus");
            this._setElementPosition(0, 0, moveNode);
          };
          contentEle.addEventListener("hideKeyBoard", hideKeyBoard);

          // 监听blur事件
          const onInputBlur = (e: FocusEvent) => {
            console.log(e, this.attachTime);
            if (e.relatedTarget) {
              //如果是直接跳到下一个输入节点，直接绑定下一个节点
              handleInputEle(e.relatedTarget as HTMLElement);
            }
            inputEle.removeEventListener("blur", onInputBlur);
          };
          inputEle.addEventListener("blur", onInputBlur);
        };
        handleInputEle(inputEle);
      } else {
        console.warn("找不到聚焦的输入框，直接挪动content和footer");
        this._setElementPosition(keyboardHeight, keyboardHeight, contentEle);
        // 监听键盘隐藏事件来回收元素位置
        const hideKeyBoard = () => {
          contentEle.removeEventListener("hideKeyBoard", hideKeyBoard);

          this._setElementPosition(0, 0, contentEle);
        };
        contentEle.addEventListener("hideKeyBoard", hideKeyBoard);
      }

      // 触发自定义事件
      const event = document.createEvent("CustomEvent");
      event.initCustomEvent("showKeyBoard", true, true, {
        inputEle,
        keyboardHeight,
        moveY,
      });
      contentEle.dispatchEvent(event);
    }

    // if (this.attachTime > 1) {
    //   if (
    //     keyboardHeight == 313 ||
    //     keyboardHeight == 258 ||
    //     keyboardHeight == 216 ||
    //     keyboardHeight == 253 ||
    //     keyboardHeight == 226 ||
    //     keyboardHeight == 271 ||
    //     keyboardHeight == 216 ||
    //     keyboardHeight == 264
    //   ) {
    //     this._setElementPosition(0);
    //   } else {
    //     if (this.attachTime > 2) {
    //       this._setElementPosition(0);
    //     } else {
    //       this._setElementPosition(keyboardHeight);
    //     }
    //   }
    // } else {
    //   this._setElementPosition(keyboardHeight);
    // }
    this.attachTime++;
  }

  private onHide() {
    console.log("onKeyboardHide");
    this.attachTime = 0;
    const contentEle: Element = this.content.getNativeElement();
    if (contentEle) {
      const event = document.createEvent("Event");
      event.initEvent("hideKeyBoard", true, true);
      contentEle.dispatchEvent(event);
    }
  }

  private _setElementPosition(
    keyboardHeight,
    moveY: number,
    moveNode: HTMLElement = this.content.getNativeElement()
  ) {
    this._setTranslateY(this.elementRef.nativeElement, keyboardHeight);
    this._setTranslateY(moveNode, moveY);
    // this.elementRef.nativeElement.style.transform = `translateY(-${keyboardHeight}px)`;
    // moveNode.style.transform = `translateY(-${moveY}px)`;
  }
  private _setTranslateY(ele: HTMLElement, val: number) {
    if (isFinite(val)) {
      val = -val;
      ele.style.transform = `translateY(${val}px)`;
    } else {
      ele.style.transform = "";
    }
  }
  private _getBound(ele: Element, translateY: number = 0): Bound {
    const rect = ele.getBoundingClientRect();
    return {
      bottom: rect.bottom - translateY,
      height: rect.height,
      left: rect.left,
      right: rect.right,
      top: rect.top - translateY,
      width: rect.width,
    };
  }
  private _booleanParse(v: any) {
    if (v) {
      v = String(v);
      return v.toLowerCase() !== "false";
    }
    return false;
  }
}
