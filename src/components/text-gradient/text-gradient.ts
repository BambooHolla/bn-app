import {
  Component,
  Input,
  ElementRef,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  SimpleChange,
  ViewChild,
} from "@angular/core";
import * as PIXI from "pixi.js";
@Component({
  selector: "text-gradient",
  templateUrl: "text-gradient.html",
})
export class TextGradientComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild("textPanel") canvasRef!: ElementRef;
  @ViewChild("textContainer") textRef!: ElementRef;

  @Input("text") text = "";
  @Input("from") from = "transparent";
  @Input("to") to = "transparent";

  @Input("stops")
  set stops(v) {
    this._stops = v;
  }
  private _stops?: (string | number)[][];
  get stops() {
    return this._stops || [[0, this.from], [1, this.to]];
  }
  @Input("fontSize") fontSize = "1.6em";
  @Input("fontWeight") fontWeight = "normal";
  @Input("fontFamily")
  fontFamily = ["-apple-system", "Helvetica Neue", "Roboto", "sans-serif"];
  @Input("direction") direction = "right";
  @Input("fallbackColor") fallbackColor = "";
  constructor(private el: ElementRef) {
    const ele = this.el.nativeElement;
  }
  get options() {
    return {
      text: this.text,
      from: this.from,
      to: this.to,
      direction: this.direction,
      fallbackColor: this.fallbackColor,
    };
  }
  private _panel?: PIXI.Application;
  devicePixelRatio = window.devicePixelRatio;
  ngOnInit() {
    this.updateText();
  }

  private _raf_ti: any;
  private _init_span_text = false;
  private span_text_node = document.createTextNode("");

  updateText() {
    // 先渲染出HTML文本
    const textEle = this.textRef.nativeElement as HTMLSpanElement;
    if (!this._init_span_text) {
      this._init_span_text = true;
      textEle.appendChild(this.span_text_node);
    }
    this.span_text_node.textContent = this.text;

    textEle.style.fontSize = this.fontSize;
    textEle.style.fontFamily = this.fontFamily.join(" ");
    textEle.style.fontWeight = this.fontWeight;
    const { width, height } = textEle.getBoundingClientRect();
    console.log("width, height", width, height);
    // 开始渲染canvas文本
    const canvas = this.canvasRef.nativeElement as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const style = getComputedStyle(textEle);
    let font = style.font || "";
    const style_fontSize = style.fontSize
    let fontSize_num = 0;
    if (style_fontSize) {
      fontSize_num = parseFloat(style_fontSize);
      let fontSize = style_fontSize
      if (this.devicePixelRatio !== 1) {
        fontSize = fontSize.replace(
          fontSize_num + "",
          (fontSize_num *= this.devicePixelRatio) + "",
        );
      }
      font = font.replace(new RegExp(style_fontSize, "g"), fontSize);
    }
    console.log("font", font);

    const { text, direction, devicePixelRatio } = this;
    ctx.font = font;
    const bounds = ctx.measureText(text);
    canvas.width = bounds.width;
    canvas.height = fontSize_num;
    const wh_rate = canvas.width / canvas.height;
    const padding_height = devicePixelRatio;
    const padding_width = devicePixelRatio * wh_rate;
    canvas.height += 2 * padding_height;
    canvas.width += 2 * padding_width;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const [x0, y0, x1, y1] = TextGradientComponent.formatDirection(
      canvas.width,
      canvas.height,
      direction,
    );
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    const stops = this.stops;
    for (let [offset, color] of stops) {
      gradient.addColorStop(offset as number, color as string);
    }
    ctx.fillStyle = gradient;
    ctx.font = font;
    ctx.fillText(text, padding_width, canvas.height - 2 * padding_height);
  }
  static formatDirection(width: number, height: number, direction: string) {
    const max = Math.max(width, height);
    const min = Math.min(width, height);
    if (direction === "to top" || direction === "top") {
      return [0, height, 0, 0];
    }
    if (direction === "to bottom" || direction === "bottom") {
      return [0, 0, 0, height];
    }
    if (direction === "to left" || direction === "left") {
      return [width, 0, 0, 0];
    }

    if (direction === "to right" || direction === "right") {
      return [0, 0, width, 0];
    }
    return [width, 0, 0, 0];
  }
  static createLinearGradient(
    width: number,
    height: number,
    x0 = 0,
    y0 = 0,
    x1 = 1,
    y1 = 1,
    stops = [[0, "#FFF"], [1, "#000"]],
  ) {
    const canvas = document.createElement("canvas");

    canvas.height = height;
    canvas.width = width;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      for (let stop of stops) {
        gradient.addColorStop(stop[0] as number, stop[1] as string);
      }
      ctx.fillStyle = gradient;

      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    return canvas;
  }
  ngOnChanges(changes: SimpleChanges) {
    this.updateText();
  }
  ngOnDestroy() {
    this._panel && this._panel.destroy();
  }
}
