import {
  Component,
  Input,
  ElementRef,
  OnInit,
  OnChanges,
  SimpleChanges,
  SimpleChange,
} from "@angular/core";
import { TextGradientDefault } from "./text-gradient-default";
import { TextGradientSVG } from "./text-gradient-svg";

@Component({
  selector: "text-gradient",
  templateUrl: "text-gradient.html",
})
export class TextGradientComponent implements OnInit, OnChanges {
  @Input("text") text = "";
  @Input("from") from = "transparent";
  @Input("to") to = "transparent";
  @Input("direction") direction = "right";
  @Input("fallbackColor") fallbackColor = "";
  get options() {
    return {
      text: this.text,
      from: this.from,
      to: this.to,
      direction: this.direction,
      fallbackColor: this.fallbackColor,
    };
  }

  // static version
  static _id = 0;
  static _implementation = TextGradientDefault;
  static _updateImplementation = function _updateImplementation() {
    if ("WebkitTextFillColor" in document.documentElement.style === false) {
      this._implementation = TextGradientSVG;
      document.body.insertAdjacentHTML(
        "afterbegin",
        "<svg id='tg-svg-container' height='0' width='0' style='position:absolute'><defs></defs></svg>",
      );
      this._svgDefsContainer = document
        .getElementById("tg-svg-container")
        .getElementsByTagName("defs")[0];
    }
  };
  static _svgDefsContainer = null;
  static _include(a, b) {
    var property;
    for (property in b) {
      if (b.hasOwnProperty(property)) {
        a[property] = b[property];
      }
    }
    return a;
  }
  constructor(public eleRef: ElementRef) {}
  private _id = TextGradientComponent._id++;
  private _svgDefsContainer = TextGradientComponent._svgDefsContainer;
  _include = TextGradientComponent._include;
  element: HTMLElement;
  ngOnInit() {
    this.element = this.eleRef.nativeElement;
    this._init();
  }
  _destroyed = false;

  /* Initialize.
     * All implementations should include this method.
     * @private, abstract
     */
  _init() {
    throw new Error("TextGradient.prototype._init not implemented");
  }

  /* Implementation to update the text contents of this.element keeping the gradient intact.
     * All implementations should include this method.
     * @public, abstract
     */
  updateText(text: string) {
    throw new Error("TextGradient.prototype.update not implemented");
  }

  /* Implementation to remove the gradient and created elements.
     * All implementations should include this method.
     * @public, abstract
     */
  destroy() {
    throw new Error("TextGradient.properties.destroy not implemented");
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.text) {
      this.updateText(this.text);
    }
  }
}
// 初始化，安装可用的模式
TextGradientComponent._updateImplementation();
TextGradientComponent._include(
  TextGradientComponent.prototype,
  TextGradientComponent._implementation,
);
