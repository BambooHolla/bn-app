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
  @ViewChild("textPanel") canvasRef: ElementRef;
  @ViewChild("textContainer") textRef: ElementRef;

  @Input("text") text = "";
  @Input("from") from = "transparent";
  @Input("to") to = "transparent";

  @Input("stops")
  set stops(v) {
    this._stops = v;
  }
  private _stops = null;
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
  private _panel: PIXI.Application;
  devicePixelRatio = window.devicePixelRatio;
  ngOnInit() {
    // this._panel = new PIXI.Application({
    //   transparent: true,
    //   autoStart: false,
    //   autoResize: false,
    //   view: this.canvasRef.nativeElement,
    //   resolution: this.devicePixelRatio,
    // });
    this.updateText();
  }

  private _btext: PIXI.Text;
  private _raf_ti: any;
  private _init_span_text = false;
  private span_text_node = document.createTextNode("");
  // updateText() {
  //   if (!this._panel) {
  //     return;
  //   }
  //   clearTimeout(this._raf_ti);
  //   this._panel.start();
  //   const { stage, renderer } = this._panel;
  //   if (stage.children.length) {
  //     stage.children.slice().forEach(c => {
  //       c.destroy();
  //     });
  //   }

  //   const textEle = this.textRef.nativeElement as HTMLSpanElement;
  //   if (!this._init_span_text) {
  //     this._init_span_text = true;
  //     textEle.appendChild(this.span_text_node);
  //   }
  //   this.span_text_node.textContent = this.text;

  //   textEle.style.fontSize = this.fontSize;
  //   textEle.style.fontFamily = this.fontFamily.join(" ");
  //   textEle.style.fontWeight = this.fontWeight;
  //   const { width, height } = textEle.getBoundingClientRect();
  //   console.log("width, height", width, height);
  //   renderer.resize(width, height);
  //   //生成文字

  //   let fontSize = this.fontSize;
  //   if (this.devicePixelRatio !== 1) {
  //     const fontSize_num = parseFloat(fontSize);
  //     fontSize = fontSize.replace(
  //       fontSize_num + "",
  //       fontSize_num * this.devicePixelRatio + "",
  //     );
  //   }
  //   this._btext = new PIXI.Text(
  //     this.text,
  //     new PIXI.TextStyle({
  //       fill: 0xffffff,
  //       fontSize: 200,
  //       fontFamily: this.fontFamily,
  //       fontWeight: this.fontWeight,
  //       dropShadow: true,
  //       dropShadowColor: 0xffffff,
  //       dropShadowBlur: 50,
  //       dropShadowDistance: 0,
  //       fillGradientStops: this.stops,
  //     }),
  //   );
  //   const _btext_render_texture = PIXI.RenderTexture.create(
  //     this._btext.width,
  //     this._btext.height,
  //   );
  //   renderer.render(this._btext, _btext_render_texture);

  //   const text_mask = new PIXI.Sprite(_btext_render_texture);

  //   text_mask.width = width;
  //   text_mask.height = height;
  //   text_mask.scale.x = text_mask.scale.y = Math.min(
  //     text_mask.scale.x,
  //     text_mask.scale.y,
  //   );
  //   text_mask.x = width / 2 - text_mask.width / 2;
  //   text_mask.y = (height / 2 - text_mask.height / 2) | 0;

  //   // 生成渐变
  //   const [x0, y0, x1, y1] = TextGradientComponent.formatDirection(
  //     width,
  //     height,
  //     this.direction,
  //   );
  //   const gradient = PIXI.Sprite.from(
  //     TextGradientComponent.createLinearGradient(
  //       width,
  //       height,
  //       x0,
  //       y0,
  //       x1,
  //       y1,
  //       this.stops,
  //     ),
  //   );
  //   console.log("this.stops", this.stops);
  //   stage.addChild(gradient);
  //   // 渐变遮罩
  //   gradient.addChild(text_mask);
  //   gradient.mask = text_mask;
  //   gradient.cacheAsBitmap = true;

  //   this._raf_ti = setTimeout(() => {
  //     try {
  //       this._panel && this._panel.stop();
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   }, 1000);
  // }

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
    const ctx = canvas.getContext("2d");
    const style = getComputedStyle(textEle);
    let font = style.font;
    let fontSize = style.fontSize;
    let fontSize_num = parseFloat(fontSize);
    if (this.devicePixelRatio !== 1) {
      fontSize = fontSize.replace(
        fontSize_num + "",
        (fontSize_num *= this.devicePixelRatio) + "",
      );
    }
    font = font.replace(new RegExp(style.fontSize, "g"), fontSize);
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

    // if (direction.indexOf("deg") !== -1) {
    // }
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
    window["ctx"] = ctx;

    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    for (let stop of stops) {
      gradient.addColorStop(stop[0] as number, stop[1] as string);
    }
    ctx.fillStyle = gradient;

    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }
  ngOnChanges(changes: SimpleChanges) {
    this.updateText();
  }
  ngOnDestroy() {
    this._panel && this._panel.destroy();
  }
}
