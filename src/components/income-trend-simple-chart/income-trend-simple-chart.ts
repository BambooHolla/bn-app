import {
  Component,
  ViewChild,
  Input,
  ElementRef,
  OnChanges,
  SimpleChanges,
  SimpleChange,
} from "@angular/core";
import { AniBase } from "../AniBase";
import { BenefitModel } from "../../providers/benefit-service/benefit.types";

@Component({
  selector: "income-trend-simple-chart",
  templateUrl: "income-trend-simple-chart.html",
})
export class IncomeTrendSimpleChartComponent extends AniBase
  implements OnChanges {
  @ViewChild("canvas") canvasRef!: ElementRef;
  @Input("list") list?: BenefitModel[];

  _init() {
    this.canvasNode || (this.canvasNode = this.canvasRef.nativeElement);
    return super._init();
  }
  private initPixiApp() {
    if (this.app) {
      this.app.stage.children.slice().forEach(child => {
        return child.destroy();
      });
      this._loop_runs.length = 0;
    }
    const { pt, px, canvasNode, list } = this;
    if (!canvasNode) {
      throw new Error("call init first");
    }
    if (!this.app) {
      this.app = new PIXI.Application({
        antialias: true,
        transparent: true,
        // backgroundColor: 0xebbb57,
        view: canvasNode,
        height: pt(canvasNode.clientHeight),
        width: pt(canvasNode.clientWidth),
        autoStart: false,
      });
    }
    if (this.list) {
      this.drawChart();
    }
    // xAxis.moveTo(0,0)
    // xAxis.lineTo()
  }
  startPixiApp() {
    this.app && this.app.start();
  }

  stopPixiApp() {
    this.app && this.app.stop();
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes["list"]) {
      this.drawChart();
    }
  }
  drawChart() {
    const app = this.app;
    if (!app) {
      return;
    }
    const { stage, renderer, ticker } = app;

    const chartContainer = new PIXI.Graphics();

    chartContainer.x = renderer.width / 2;
    chartContainer.y = renderer.height * 0.1;

    stage.addChild(chartContainer);

    const xAxis = new PIXI.Graphics();
    const yAxis = new PIXI.Graphics();
  }
}
