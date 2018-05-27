import {
  Component,
  ViewChild,
  Input,
  ElementRef,
  OnChanges,
  SimpleChanges,
  SimpleChange,
  ChangeDetectionStrategy,
} from "@angular/core";
import { AniBase } from "../AniBase";
import { BenefitModel } from "../../providers/benefit-service/benefit.types";

@Component({
  selector: "income-trend-simple-chart",
  templateUrl: "income-trend-simple-chart.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncomeTrendSimpleChartComponent extends AniBase
  implements OnChanges {
  constructor() {
    super();
    this.on("init-start", this.initPixiApp.bind(this));
    this.on("start-animation", this.startPixiApp.bind(this));
    this.on("stop-animation", this.stopPixiApp.bind(this));
  }
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
      this.app = this.PIXIAppbuilder({
        antialias: true,
        transparent: true,
        // backgroundColor: 0xebbb57,
        view: canvasNode,
        height: pt(canvasNode.clientHeight),
        width: pt(canvasNode.clientWidth),
        autoStart: false,
      });
    }
    this.drawChart();
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
    const { pt } = this;
    const { stage, renderer, ticker } = app;
    const { width: W, height: H } = renderer;
    const list = this.list;
    stage.children.slice().forEach(c => c.destroy());
    if (!list) {
      return;
    }

    const chartContainer = new PIXI.Graphics();

    stage.addChild(chartContainer);

    const xAxis = new PIXI.Graphics();
    const yAxis = new PIXI.Graphics();
    const cLine = new PIXI.Graphics();
    chartContainer.addChild(xAxis);
    chartContainer.addChild(yAxis);
    chartContainer.addChild(cLine);
    const text_style = {
      fontSize: pt(9),
      fill: 0xffffff,
    };
    const xAxis_height = pt(12);
    const yAxis_height = H - xAxis_height;

    /// 绘制Y轴
    const amount_list = list.map(i => parseFloat(i.amount) / 1e8);
    const average_amount =
      amount_list.reduce((o, v) => o + v, 0) / amount_list.length;
    const max_amount = Math.max(...amount_list, average_amount * 1.1) || 1; // 如果是0，则默认为1
    const min_amount = 0;//Math.min(...amount_list, average_amount * 0.9);
    const pad_amount =
      (max_amount - min_amount) * (text_style.fontSize / 2 / yAxis_height);
    {
      const mid_amount = (max_amount + min_amount) / 2;

      const max_amount_text = new PIXI.Text(max_amount.toFixed(8), text_style);
      const min_amount_text = new PIXI.Text(min_amount.toFixed(8), text_style);
      const mid_amount_text = new PIXI.Text(mid_amount.toFixed(8), text_style);
      const amount_text_max_width = Math.max(
        max_amount_text.width,
        mid_amount_text.width,
        min_amount_text.width,
      );

      yAxis.addChild(max_amount_text);
      max_amount_text.x = amount_text_max_width - max_amount_text.width;
      yAxis.addChild(mid_amount_text);
      mid_amount_text.y = yAxis_height / 2 - mid_amount_text.height / 2;
      mid_amount_text.x = amount_text_max_width - mid_amount_text.width;
      yAxis.addChild(min_amount_text);
      min_amount_text.y = yAxis_height - min_amount_text.height;
      min_amount_text.x = amount_text_max_width - min_amount_text.width;

      const y_line_start_x = max_amount_text.width + pt(5);
      yAxis.moveTo(y_line_start_x, 0);
      yAxis.lineStyle(pt(0.6), 0xffffff, 0.6);
      yAxis.lineTo(y_line_start_x, yAxis_height);
    }

    /// 绘制X坐标轴
    const xAxis_width = renderer.width - yAxis.width;
    const max_x_item_width = new PIXI.Text(list[0].height + "", text_style)
      .width;
    const min_x_item_width = new PIXI.Text(
      list[list.length - 1].height + "",
      text_style,
    ).width;
    const xAxis_line_width =
      xAxis_width - max_x_item_width / 2 - min_x_item_width / 2;
    {
      const maybe_num = Math.min(
        Math.floor(xAxis_line_width / (max_x_item_width * 1.5)),
        list.length,
      );

      for (let len = maybe_num - 1, i = len; i >= 0; i--) {
        const item = list[((list.length - 1) * (i / len)) | 0];
        const x_item = new PIXI.Text(item.height + "", text_style);
        // if (i === 0) {
        //   x_item.x = xAxis_line_width - x_item.width;
        // } else if (i === len) {
        //   x_item.x = 0;
        // } else {
        x_item.x = (len - i) / len * xAxis_line_width - x_item.width / 2;
        // }
        x_item.y = xAxis_height - x_item.height;
        xAxis.addChild(x_item);
      }
      xAxis.moveTo(0, 0);
      xAxis.lineStyle(pt(0.6), 0xffffff, 0.6);
      xAxis.lineTo(xAxis_line_width, 0);
      xAxis.x = renderer.width - xAxis.width;
      xAxis.y = renderer.height - xAxis.height;
    }

    /// 绘制曲线
    const y_max_amount = max_amount + pad_amount;
    const y_min_amount = min_amount - pad_amount;
    const y_dif_amount = y_max_amount - y_min_amount;
    function getY(amount: number) {
      return (
        yAxis_height - (amount - y_min_amount) / y_dif_amount * yAxis_height
      );
    }
    // 从最小的点开始画
    const reversed_list = amount_list.reverse();
    cLine.lineStyle(pt(2.5), 0xffffff, 1);
    for (
      let i = -1, len = reversed_list.length - 1, next_x, next_y;
      i < len;
      i += 1
    ) {
      const x = next_x;
      const y = next_y;
      next_x = (i + 1) / len * xAxis_line_width;
      next_y = getY(reversed_list[i + 1]);
      if (i === 0) {
        cLine.moveTo(x, y);
      } else if (i === len) {
        cLine.lineTo(x, y);
      } else if (i > 0) {
        cLine.quadraticCurveTo(x, y, (x + next_x) / 2, (y + next_y) / 2);
      }
    }
    cLine.x = yAxis.width;
    cLine.y = 0;
    // cLine.cacheAsBitmap = true;
    const cLineTexture = cLine.generateCanvasTexture();
    const cLineStroke = new PIXI.Sprite(cLineTexture);
    cLineStroke.filters = [new PIXI.filters.BlurFilter(10)];
    cLine.addChild(cLineStroke);
    this.forceRenderOneFrame();
  }
}
