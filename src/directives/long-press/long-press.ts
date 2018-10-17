import { Directive, EventEmitter, ElementRef, ViewChild, Output, Input } from '@angular/core';

@Directive({
  selector: '[long-press]' // Attribute selector
})
export class LongPressDirective {
  @Output('long-press') long_press = new EventEmitter();
  @Input('long-press-duration') duration = 2e3;
  constructor(public eleRef: ElementRef) {
    const ele = eleRef.nativeElement as HTMLButtonElement;
    if (ele.hasAttribute('onpointerdown')) {
      ele.addEventListener('pointerdown', this.handle_start.bind(this));
      ele.addEventListener('pointerup', this.handle_end.bind(this));
      ele.addEventListener('pointercancel', this.handle_end.bind(this));
    } else {
      ele.addEventListener('touchstart', this.handle_start.bind(this));
      ele.addEventListener('touchend', this.handle_end.bind(this));
      ele.addEventListener('touchcancel', this.handle_end.bind(this));
    }
  }
  private _handle_ti?: any
  handle_start(e: PointerEvent | TouchEvent) {
    console.log('handle_start', e)
    this._handle_ti = setTimeout(() => {
      this.long_press.emit(e);
      this.handle_end();
    }, this.duration);
    e.preventDefault();
  }
  handle_end() {
    console.log('handle_end')
    if (this._handle_ti) {
      clearTimeout(this._handle_ti);
      this._handle_ti = undefined;
    }
  }
}
