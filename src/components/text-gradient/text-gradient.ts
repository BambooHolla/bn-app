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
  ChangeDetectionStrategy,
} from "@angular/core";
import * as PIXI from "pixi.js";
@Component({
  selector: "text-gradient",
  templateUrl: "text-gradient.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  @Input("no-trim-blank") no_trim_blank = false;
  @Input("fontSize") fontSize = "1.6em";
  @Input("fontWeight") fontWeight = "normal";
  @Input("fontFamily")
  fontFamily = [
    "-apple-system",
    "SF Compact Display",
    "Helvetica Neue",
    "Roboto",
    "sans-serif",
  ];
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
    textEle.style.fontFamily = this.fontFamily as any;
    textEle.style.fontWeight = this.fontWeight;
    const { width, height } = textEle.getBoundingClientRect();
    // console.log("width, height", width, height);
    // 开始渲染canvas文本
    const canvas = this.canvasRef.nativeElement as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const style = getComputedStyle(textEle);
    let font = style.font || "";
    const style_fontSize = style.fontSize;
    let fontSize_num = 0;
    if (style_fontSize) {
      fontSize_num = parseFloat(style_fontSize);
      let fontSize = style_fontSize;
      if (this.devicePixelRatio !== 1) {
        fontSize = fontSize.replace(
          fontSize_num + "",
          (fontSize_num *= this.devicePixelRatio) + ""
        );
      }
      font = font.replace(new RegExp(style_fontSize, "g"), fontSize);
    }
    // console.log("font", font);

    const { text, direction, devicePixelRatio } = this;
    ctx.font = font;
    const bounds = ctx.measureText(text);
    canvas.width = bounds.width;
    canvas.height = fontSize_num;
    if (canvas.width == 0 || canvas.height == 0) {
      return;
    }
    const wh_rate = canvas.width / canvas.height;
    const padding_height = devicePixelRatio;
    const padding_width = devicePixelRatio * wh_rate;
    const canvas_base_height = canvas.height + 2 * padding_height;
    canvas.height = Math.max(
      canvas_base_height,
      height * this.devicePixelRatio
    );
    canvas.width += 2 * padding_width;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const [x0, y0, x1, y1] = TextGradientComponent.formatDirection(
      canvas.width,
      canvas.height,
      direction
    );
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    const stops = this.stops;
    stops.forEach(([offset, color]) => {
      gradient.addColorStop(offset as number, color as string);
    });
    ctx.fillStyle = gradient;
    ctx.font = font;
    ctx.fillText(text, padding_width, canvas_base_height - 2 * padding_height);
    if (!this.no_trim_blank) {
      // 过滤掉空白
      const bound = TextGradientComponent.trim(canvas);
      if (
        bound &&
        (canvas.width !== bound.width || canvas.height !== bound.height)
      ) {
        const data = ctx.getImageData(
          bound.left,
          bound.top,
          bound.width,
          bound.height
        );
        canvas.width = bound.width;
        canvas.height = bound.height;
        ctx.putImageData(data, 0, 0);
      }
    }
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
    stops = [[0, "#FFF"], [1, "#000"]]
  ) {
    const canvas = document.createElement("canvas");

    canvas.height = height;
    canvas.width = width;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      stops.forEach(stop => {
        gradient.addColorStop(stop[0] as number, stop[1] as string);
      });
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
  static trim(c: HTMLCanvasElement) {
    const ctx = c.getContext("2d");
    if (!ctx) {
      return null;
    }
    const pixels = ctx.getImageData(0, 0, c.width, c.height);
    const l = pixels.data.length;
    const bound = {
      top: Infinity,
      left: Infinity,
      right: -Infinity,
      bottom: -Infinity,
      width: 0,
      height: 0,
    };

    // 从上往下扫描
    const data = pixels.data;
    for (var i = 3; i < l; i += 4) {
      if (data[i] !== 0) {
        bound.top = (i / 4 / c.width) | 0;
        break;
      }
    }
    if (bound.top == Infinity) {
      // 全透明
      return null;
    }
    // 从下往上扫描
    for (var i = l - 1; i >= 0; i -= 4) {
      if (data[i] !== 0) {
        bound.bottom = ((i / 4 / c.width) | 0) + 1;
        break;
      }
    }
    // 从左往右扫描
    const pre_line_i = c.width * 4;
    for (var x = 0; x < c.width; x += 1) {
      const x_alpha = x * 4 + 3;
      for (var y = bound.top; y < bound.bottom; y += 1) {
        const i = y * pre_line_i + x_alpha;
        if (data[i] !== 0) {
          bound.left = x;
          break;
        }
      }
      if (bound.left !== Infinity) {
        break;
      }
    }
    // 从右往左扫描
    for (var x = c.width - 1; x >= 0; x -= 1) {
      const x_alpha = x * 4 + 3;
      for (var y = bound.top; y < bound.bottom; y += 1) {
        const i = y * pre_line_i + x_alpha;
        if (data[i] !== 0) {
          bound.right = x + 1;
          break;
        }
      }
      if (bound.right !== -Infinity) {
        break;
      }
    }

    const trimHeight = (bound.height = bound.bottom - bound.top);
    const trimWidth = (bound.width = bound.right - bound.left);
    if (!(trimHeight && trimWidth)) {
      return null;
    }
    // var trimmed = ctx.getImageData(
    //   bound.left,
    //   bound.top,
    //   trimWidth,
    //   trimHeight,
    // );
    // const copy = document.createElement("canvas").getContext("2d");
    // copy.canvas.width = trimWidth;
    // copy.canvas.height = trimHeight;
    // copy.putImageData(trimmed, 0, 0);

    return bound;
  }
}
