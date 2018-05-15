import {
  Directive,
  Input,
  ElementRef,
  OnChanges,
  SimpleChanges,
  SimpleChange,
  ViewChildren,
  QueryList,
  AfterViewInit,
  ContentChildren,
  AfterContentInit,
  AfterViewChecked,
  AfterContentChecked,
  OnDestroy,
} from "@angular/core";

const ani_end_name =
  "onanimationend" in document.body
    ? "onanimationend"
    : "onwebkitanimationend" in document.body
      ? "onwebkitanimationend"
      : "";

const MB: typeof MutationObserver =
  window["MutationObserver"] || window["WebKitMutationObserver"];

@Directive({
  selector: "[list-ani]",
})
export class ListAniDirective
  implements OnChanges, AfterContentInit, OnDestroy {
  @Input("list-ani")
  set animateName(v) {
    if (v !== this._animateName) {
      this._animateName = v || "fadeInRight";
      this._ani_duration = 0; // 重置，需要对动画的单元时间进行重新计算
    }
  }
  get animateName() {
    return this._animateName;
  }
  _animateName = "fadeInRight";
  constructor(private elementRef: ElementRef) {
    console.log("Hello ListAniDirective Directive");
    this.setEleAni();
    window["listAni"] = this;
  }

  get ele() {
    return this.elementRef.nativeElement as HTMLElement;
  }
  private _cur_ani_classname;
  setEleAni() {
    this.ele.classList.add(
      (this._cur_ani_classname = `list-${this.animateName}-ani`),
    );
  }
  delEleAni() {
    this.ele.classList.remove(this._cur_ani_classname);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.animateName) {
      this.delEleAni();
      this.setEleAni();
    }
  }

  ngAfterContentInit() {
    console.log("ngAfterContentInit aniItem length", this.ele.children.length);
    this.bindEnterAniForNodes(Array.prototype.slice.call(this.ele.children));

    const observer = (this.observer = new MB(mutations => {
      mutations.forEach(mutation => {
        this.bindEnterAniForNodes(
          Array.prototype.slice.call(mutation.addedNodes),
        );
      });
    }));
    // 配置观察选项:
    var config = { childList: true };
    // 传入目标节点和观察选项
    observer.observe(this.ele, config);
  }
  observer?: MutationObserver;
  ngOnDestroy() {
    this.observer && this.observer.disconnect();
  }
  static aniKey = "[list-ani]KEY:" +
  Math.random()
    .toString(36)
    .substr(2);
  /**
   * 最后一个元素开始动画的时间点
   */
  private _last_ani?: number;
  /**
   * 动画间隔60ms
   */
  @Input("ani-interval") ani_interval = 60;
  bindEnterAniForNodes(eles: HTMLElement[]) {
    const aniKey = ListAniDirective.aniKey;
    const ani_item_classname = this._cur_ani_classname + "-item";
    eles.forEach(ele => {
      if (ele[aniKey]) {
        return;
      }
      ele[aniKey] = true;
      ele.classList.add(ani_item_classname);
      var delay = 0;
      if (this._last_ani) {
        delay = this._last_ani + this.ani_interval - +new Date();
      }

      this._last_ani = +new Date();
      if (delay > 0) {
        this._last_ani += delay;
        ele.style.animationDelay = delay + "ms";
      }

      this.watchAniEnd(
        ele,
        () => {
          ele.classList.remove(ani_item_classname);
          ele.style.animationDelay = "";
        },
        ani_item_classname,
      );
    });
  }
  _ani_duration = 0;
  private watchAniEnd(ele: HTMLElement, cb: any, ani_class_name: string) {
    if (ani_end_name) {
      ele.addEventListener(ani_end_name, cb);
    } else {
      if (!this._ani_duration) {
        const animationDuration = getComputedStyle(ele).animationDuration;
        if (animationDuration) {
          if (animationDuration.endsWith("ms")) {
            this._ani_duration = parseFloat(animationDuration);
          } else if (animationDuration.endsWith("s")) {
            this._ani_duration = parseFloat(animationDuration) * 1000;
          }
        }
      }
      setTimeout(cb, this._ani_duration || 1000);
    }
  }
}
