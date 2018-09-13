import { Directive, Input, ElementRef } from '@angular/core';

@Directive({
  selector: '[backdrop-blur]' // Attribute selector
})
export class BackdropBlurDirective {
  _blurPX = 0;
  @Input('backdrop-blur')
  set blurPX(v) {
    let blurPx = parseFloat(v as any) || 0;
    if (blurPx < 0) {
      blurPx = 0;
    }
    this._blurPX = blurPx;
    this._setBackdropFilter();
  }
  get blurPX() {
    return this._blurPX;
  }

  constructor(private elementRef: ElementRef) {
    // console.log('Hello BackdropBlurDirective Directive');
    const ele: HTMLElement = elementRef.nativeElement;
    const nativeElementStyle: any = ele.style;
    // console.log('[backdrop-blur] ', this.blurPX);
    if (
      'backdropFilter' in nativeElementStyle ||
      'webkitBackdropFilter' in nativeElementStyle
    ) {
      this.canBackdropFilter = true;
      ele.dataset.canBackdropFilter = 'true';
    }
  }
  canBackdropFilter = false;
  private _setBackdropFilter() {
    if (this.canBackdropFilter) {
      const nativeElementStyle: any = this.elementRef.nativeElement.style;
      this.elementRef.nativeElement.dataset.hasBackdropFilter =
        !!this.blurPX + '';
      // console.log('[backdrop-blur] ', this.blurPX);
      if (this.blurPX) {
        nativeElementStyle.backdropFilter = nativeElementStyle.webkitBackdropFilter = `blur(${this
          .blurPX}px)`;
      } else {
        nativeElementStyle.backdropFilter = nativeElementStyle.webkitBackdropFilter =
          '';
      }
    }
  }
}
