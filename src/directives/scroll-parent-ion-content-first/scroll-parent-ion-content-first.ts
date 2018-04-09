import {
  Directive,
  Input,
  ViewChild,
  OnInit,
  OnDestroy,
  Renderer2,
} from "@angular/core";
import { Content } from "ionic-angular";
import { Subscription } from "rxjs/Subscription";
import { tryRegisterGlobal } from "../../bnqkl-framework/FLP_Tool";

@Directive({
  selector: "[scroll-parent-ion-content-first]", // Attribute selector
})
export class ScrollParentIonContentFirstDirective implements OnInit, OnDestroy {
  constructor(public content: Content) {
    tryRegisterGlobal("spicf", this);
  }
  @Input("scroll-parent-ion-content-first") parent_content?: Content;
  private _sub?: Subscription;
  ngOnInit() {
    if (!this.parent_content) {
      throw new Error(
        "scroll-parent-ion-content-first should input parentContent",
      );
    }
    const ele = this.content.getElementRef().nativeElement as HTMLElement;
    this._sub = this.content.ionScroll.subscribe(v => {
      const bound = ele.getBoundingClientRect();
      // console.log(
      //   v,
      //   document.body.clientHeight - bound.top,
      //   bound.height,
      // );
      if (this.parent_content) {
        const content_view_height = document.body.clientHeight - bound.top;
        if (content_view_height < bound.height) {
          if (content_view_height + 1 > bound.height) {
            // this.parent_content.scrollToBottom(0);
            // 可能有小数误差，忽略，在1像素以内就忽略
          } else {
            this.parent_content.scrollTo(0, v.scrollTop, 0);
          }
        }
      }
    });
  }
  ngOnDestroy() {
    this._sub && this._sub.unsubscribe();
  }
}
