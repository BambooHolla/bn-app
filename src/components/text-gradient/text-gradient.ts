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
  @Input("text") text = "";
  @Input("from") from = "transparent";
  @Input("to") to = "transparent";
  @Input("fontSize") fontSize = "1.4rem";
  @Input("fontFamily")
  fontFamily = ["-apple-system", "Helvetica Neue", "Roboto", "sans-serif"];
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
  private _panel: PIXI.Application;
  ngOnInit() {
    this._panel = new PIXI.Application({
      transparent: true,
      autoStart: false,
      autoResize: false,
      view: this.canvasRef.nativeElement,
    });
    this.updateText();
  }

  private _btext: PIXI.extras.BitmapText = new PIXI.extras.BitmapText("");
  updateText() {
    if (!this._panel) {
      return;
    }
    this._panel.start();
    const { stage, render } = this._panel;
    const { _btext: btext } = this;
    btext.parent || stage.addChild(btext);

    btext.text = this.text;
    btext.font = "";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._panel && this._panel.stop();
      });
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.text) {
      this.updateText();
    }
  }
  ngOnDestroy() {
    this._panel && this._panel.destroy();
  }
}
