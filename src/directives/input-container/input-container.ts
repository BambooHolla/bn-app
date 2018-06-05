import { Directive, ElementRef, OnDestroy, Input } from "@angular/core";

/**
 * Generated class for the InputContainerDirective directive.
 *
 * See https://angular.io/api/core/Directive for more info on Angular
 * Directives.
 */
@Directive({
  selector: ".input-container", // Attribute selector
})
export class InputContainerDirective implements OnDestroy {
  @Input("disabled")
  set disabled(v) {
    v = !!v;
    if (this._disabled !== v) {
      this._disabled = v;
      if (v) {
        this.ele.classList.add("disabled");
      } else {
        this.ele.classList.remove("disabled");
      }
      for (var i = 0; i < this.ele.childNodes.length; i += 1) {
        const node = this.ele.childNodes[i];
        if (
          node.nodeType === 1 &&
          (node as HTMLElement).tagName.toUpperCase() === "INPUT"
        ) {
          (node as HTMLInputElement).disabled = v;
        }
      }
    }
  }
  _disabled = false;
  get disabled() {
    return this._disabled;
  }
  constructor(private _eleRef: ElementRef) {
    console.log("QAQQQQ");
    // this.observer = new MutationObserver(function(mutations) {
    // 	mutations.forEach(function(mutation) {
    // 		console.log(mutation.type);
    // 	});
    // });

    // // 配置观察选项:
    // var config = { attributes: true };

    // // 传入目标节点和观察选项
    // observer.observe(target, config);
  }
  // private observer: MutationObserver;
  public ele: HTMLElement = this._eleRef.nativeElement;
  ngOnDestroy() {}
}
