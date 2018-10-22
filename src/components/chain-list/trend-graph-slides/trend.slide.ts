import * as PIXI from "pixi.js";
type TrendPointData = [number, number];
import { calcOutterNearRange, calcRangeScale, ObjectOptionsType } from "./helper";
import { AniBase } from "../../AniBase";

const commonFontFamily = ["-apple-system", "SF Compact Display", "Helvetica Neue", "Roboto", "sans-serif"];
const iconFontFamily = ["ifmicon", ...commonFontFamily];

export class TrendSlide extends PIXI.Graphics {
  public title_icon_content = "";
  constructor(
    public view_width: number,
    public view_height: number,
    public title_content: string,
    public app: PIXI.Application,
    opts?: {
      title_icon?: string;
      devicePixelRatio?: number;
      title_style?: ObjectOptionsType<typeof TrendSlide.prototype.title_style>;
      chart_line_style?: ObjectOptionsType<typeof TrendSlide.prototype.chart_line_style>;
      auxiliary_text_style?: ObjectOptionsType<typeof TrendSlide.prototype.auxiliary_text_style>;
    }
  ) {
    super();
    if (opts) {
      if (typeof opts.devicePixelRatio === "number") {
        this.devicePixelRatio = opts.devicePixelRatio;
      }
      if (opts.title_icon) {
        this.title_icon_content = opts.title_icon;
      }
      ["title_style", "chart_line_style", "auxiliary_text_style"].forEach(key => {
        if (key in opts) {
          this[key] = Object.assign(this[key], opts[key]);
        }
      });
    }
  }
  devicePixelRatio = window.devicePixelRatio;
  pt = px => this.devicePixelRatio * px;
  px = pt => pt / this.devicePixelRatio;
  title_style = {
    fontSize: this.pt(12),
    fontFamily: commonFontFamily.slice(),
    fill: 0x7b7b7b,
    fontWeight: "bold",
  };
  title_icon_style = {
    fontSize: this.pt(14),
    fontFamily: iconFontFamily.slice(),
    fill: 0x7b7b7b,
    fontWeight: "bold",
  };
  coo_text_style = {
    fontSize: this.pt(10),
    fontFamily: commonFontFamily.slice(),
    fill: 0x9f9f9f,
    // fontWeight: "lighter",
  };
  coo_line_style = {
    fill: 0xdddddd,
    width: 1,
    alpha: 1,
  };
  chart_line_style = {
    gradient: [
      [0, "#83d6f7"],
      // [0.2, "#83d6f7"],
      [1, "#73f5e0"],
    ],
  };

  padding = {
    top: this.pt(10),
    left: this.pt(10),
    bottom: this.pt(10),
    right: this.pt(10),
  };
  auxiliary_text_style = {
    fontSize: this.pt(11),
    fontFamily: commonFontFamily.slice(),
    fill: 0x83d6f7,
  };

  private _data: TrendPointData[] = [];
  private _data_dirty = false;
  private _point_list: PIXI.Point[] = [];
  set data(v) {
    if (this._data !== v) {
      this._data = v;
      this._data_dirty = true;
      this.draw();
    }
  }
  get data() {
    return this._data;
  }
  get point_list() {
    if (this._data_dirty) {
      const {
        _y_coo_max: y_coo_max,
        _y_coo_min: y_coo_min,
        _x_coo_max: x_coo_max,
        _x_coo_min: x_coo_min,
        _chart_height: chart_height,
        _chart_width: chart_width,
      } = this;
      const x_coo_diff = x_coo_max - x_coo_min;
      const y_coo_diff = y_coo_max - y_coo_min;
      this._point_list = this.data.map(([x_val, y_val]) => {
        return new PIXI.Point(((x_val - x_coo_min) / x_coo_diff) * chart_width, (1 - (y_val - y_coo_min) / y_coo_diff) * chart_height);
      });
      this._data_dirty = false;
    }
    return this._point_list;
  }

  titleIconText?: PIXI.Text;
  titleText?: PIXI.Text;
  draw() {
    this.drawBg();
    this.drawTitle();
    this.drawCoordinate();
    this.drawChartLine();
    this.emit("refresh-frame");
  }
  chartCardBg = PIXI.Sprite.from(`./assets/imgs/tab-chain/chart-card-bg.png`);
  private _inited_bg = false;
  /**绘制背景*/
  drawBg() {
    if (this._inited_bg) {
      return;
    }
    this._inited_bg = true;
    const { chartCardBg } = this;
    const onLoad = () => {
      if (chartCardBg.texture.width > 1) {
        chartCardBg.width = this.view_width;
        chartCardBg.height = this.view_height;
      }
    };

    chartCardBg.texture.on("update", onLoad);
    this.addChildAt(chartCardBg, 0);
    onLoad();
  }
  /**绘制标题*/
  drawTitle() {
    const { title_content, title_style, title_icon_content, title_icon_style, padding } = this;
    let { titleText, titleIconText } = this;

    if (!titleIconText) {
      this.titleIconText = titleIconText = new PIXI.Text(title_icon_content, title_icon_style);
      this.addChild(titleIconText);
      titleIconText.position.set(padding.left, padding.top);
    } else {
      titleIconText.text = title_icon_content;
    }
    if (!titleText) {
      this.titleText = titleText = new PIXI.Text(title_content, title_style);
      this.addChild(titleText);
      titleText.position.set(padding.left + (titleIconText ? titleIconText.x + titleIconText.width / 2 : 0), padding.top);
    } else {
      titleText.text = this.title_content;
    }
  }
  coordinateMesh?: PIXI.Graphics;
  chartLine = new PIXI.Graphics();
  protected _y_coo_max = 0;
  protected _y_coo_min = 0;
  protected _x_coo_max = 0;
  protected _x_coo_min = 0;
  protected _chart_height = 0;
  protected _chart_width = 0;
  DESTORY_ABLE_SYMBOL = Symbol.for("destoryable");
  // protected _mesh_height = 0;
  // protected _mesh_width = 0;
  // protected _mesh_left = 0;
  /**绘制坐标轴*/
  drawCoordinate() {
    const { data, view_height, view_width, coo_text_style, padding, coo_line_style, chartLine, DESTORY_ABLE_SYMBOL } = this;
    const x_data = data.map(d => d[0]);
    const y_data = data.map(d => d[1]);
    const [y_coo_max, y_coo_min] = calcOutterNearRange(y_data, {
      min_val: 0,
    });
    const x_coo_max = Math.max(...x_data);
    const x_coo_min = Math.min(...x_data);

    let { coordinateMesh } = this;
    if (!coordinateMesh) {
      const { titleText } = this;
      if (!titleText) {
        throw new Error("titleText no init");
      }
      this.coordinateMesh = coordinateMesh = new PIXI.Graphics();
      coordinateMesh.y = titleText.y + titleText.height + this.pt(5);
      // coordinateMesh.x = padding.left;
      this.addChild(coordinateMesh);
    } else {
      coordinateMesh.clear();
      coordinateMesh.children.slice().forEach(c => {
        if (c[DESTORY_ABLE_SYMBOL]) {
          c.destroy();
        }
      });
    }
    const mesh_height = this.view_height - coordinateMesh.y - coo_text_style.fontSize * 2 - padding.bottom;

    let max_y_text: PIXI.Text | undefined;
    /// 绘制Y轴的刻度
    {
      // 算出坐标文字以及其对应的位置
      const scale_list = calcRangeScale(y_coo_max, y_coo_min, mesh_height / (coo_text_style.fontSize * 1.5));
      // console.log(scale_list);
      let max_width = 0;
      let text_height = 0;

      for (var i = 0; i < scale_list.length; i += 1) {
        const scale_item = scale_list[i];
        const [pos_rate, val] = scale_item;
        const t = new PIXI.Text(val.toString(), coo_text_style);
        t[DESTORY_ABLE_SYMBOL] = true;
        if (i == 0) {
          max_width = t.width;
          max_y_text = t;
          text_height = t.height;
          t.x = padding.left;
        } else {
          // 右对齐
          t.x = max_width - t.width + padding.left;
        }
        t.y = pos_rate * mesh_height; //+ text_height / 2;
        coordinateMesh.addChildAt(t, 0);
      }
    }
    if (!max_y_text) {
      throw new Error("max_y_text no init");
    }
    const coo_x_left = max_y_text.x + max_y_text.width + this.pt(10);
    const mesh_width = view_width - padding.right - coo_x_left;
    /// 绘制X轴的刻度
    {
      const pos_y = mesh_height + coo_text_style.fontSize;
      // 绘制“高度”图标
      const height_icon_text = new PIXI.Text("\ue674", {
        fontFamily: iconFontFamily,
        fontSize: coo_text_style.fontSize * 1.3,
        fill: coo_text_style.fill,
      });
      height_icon_text[DESTORY_ABLE_SYMBOL] = true;
      height_icon_text.x = coo_x_left - coo_text_style.fontSize * 0.3;
      height_icon_text.y = pos_y - coo_text_style.fontSize * 0.15;
      coordinateMesh.addChildAt(height_icon_text, 0);
      const height_icon_right = coo_x_left + height_icon_text.width - coo_text_style.fontSize * 0.3;
      const coo_x_width = view_width - padding.right - height_icon_right;

      // 算出坐标文字以及其对应的位置
      const scale_list = calcRangeScale(x_coo_max, x_coo_min, coo_x_width / (coo_text_style.fontSize * 0.6 * x_coo_max.toString().length * 2));

      for (var i = 0; i < scale_list.length; i += 1) {
        const scale_item = scale_list[i];
        const [_pos_rate, val] = scale_item;
        const pos_rate = 1 - _pos_rate;
        const t = new PIXI.Text(val.toString(), coo_text_style);
        t[DESTORY_ABLE_SYMBOL] = true;
        const text_width = t.width;
        t.x = height_icon_right + pos_rate * coo_x_width - pos_rate * text_width;
        t.y = pos_y;
        coordinateMesh.addChildAt(t, 0);
      }
      chartLine.position.set(height_icon_right, 0);
      this._chart_width = coo_x_width;
    }
    /// 绘制坐标轴线
    {
      coordinateMesh.lineStyle(coo_line_style.width, coo_line_style.fill, coo_line_style.alpha);
      coordinateMesh.moveTo(coo_x_left, 0);
      const x_coo_y = mesh_height + coo_text_style.fontSize / 2;
      coordinateMesh.lineTo(coo_x_left, x_coo_y);
      coordinateMesh.lineTo(view_width - padding.right, x_coo_y);
    }
    /// 绘制一层透明层，用于可触摸
    {
      coordinateMesh.lineStyle(0);
      coordinateMesh.beginFill(0x0, 0);
      coordinateMesh.drawRect(0, 0, view_width, this.view_height - coordinateMesh.y);
      coordinateMesh.endFill();
    }

    // 放入线条画板
    coordinateMesh.addChild(chartLine);
    this._y_coo_max = y_coo_max;
    this._y_coo_min = y_coo_min;
    this._x_coo_max = x_coo_max;
    this._x_coo_min = x_coo_min;
    this._chart_height = mesh_height;
    // this._mesh_width = mesh_width;
    // this._mesh_height = mesh_height;
    // this._mesh_left  =coo_x_left;
  }
  chart_line_width = this.pt(2);

  chartLineGradientCover?: PIXI.Sprite;
  private _chartLineGradientCanvasTexture?: HTMLCanvasElement;

  getChartLineGradientColor(x: number, y?: number): Uint8Array | Uint8ClampedArray {
    const { _chartLineGradientCanvasTexture, chartLineGradientCover } = this;

    if (!chartLineGradientCover || !_chartLineGradientCanvasTexture) {
      throw new Error("chartLineGradientCover not init");
    }
    const { width } = chartLineGradientCover;
    if (x > width || x < 0) {
      throw new RangeError("getChartLineGradientColor:x range error");
    }
    const pos_x = Math.floor((x / width) * _chartLineGradientCanvasTexture.width);
    const ctx = _chartLineGradientCanvasTexture.getContext("2d");
    if (!ctx) {
      throw new Error("2d ctx not found, should not happend");
    }
    const data = ctx.getImageData(pos_x, 0, 1, 1);
    return data.data;
  }
  /**绘制曲线*/
  drawChartLine() {
    const { data } = this;
    const {
      chart_line_width,
      coordinateMesh,
      chartLine,
      _chart_height: chart_height,
      _chart_width: chart_width,
      /// 算出相对点的位置
      point_list,
    } = this;

    /// 开始绘制
    chartLine.clear();
    chartLine.lineStyle(chart_line_width, 0x000000, 1);
    // chartLine.nativeLines = true;
    for (var i = -1, len = point_list.length, next_x, next_y; i < len; i += 1) {
      const x = next_x;
      const y = next_y;
      const next_point = point_list[i + 1];
      if (next_point) {
        next_x = next_point.x;
        next_y = next_point.y;
      }
      // console.log(next_point);
      if (i === 0) {
        chartLine.moveTo(x, chart_height + chart_line_width);
        chartLine.lineTo(x, y);
      } else if (i === len - 1) {
        chartLine.lineTo(x, y);
        chartLine.lineTo(x, chart_height + chart_line_width);
      } else if (i > 0) {
        // 因为要精准定位坐标轴，所以这里暂时无法用曲线
        // chartLine.lineTo(x, y);
        // chartLine.bezierCurveTo(x+chart_width/len/2,y,x-chart_width/len/2,y,x,y)
        // chartLine.quadraticCurveTo(
        // 	x,
        // 	y,
        // 	(x + next_x) / 2,
        // 	(y + next_y) / 2
        // );
        const pre_point = point_list[i - 1];
        // console.log((x + pre_point.x) / 2, (y + pre_point.y) / 2, x, y);
        // let ctrl_x = (x + pre_point.x) /2
        // let ctrl_y = y;
        // chartLine.quadraticCurveTo(
        // 	ctrl_x,//(x + pre_point.x) /2,
        // 	ctrl_y,//(y + pre_point.y + next_y) / 3,
        // 	x,
        // 	y
        // );
        const unit_diff_x = (x - pre_point.x) / 4;
        const ctrl_1_x = unit_diff_x + pre_point.x;
        const ctrl_1_y = pre_point.y;
        const ctrl_2_x = unit_diff_x * 3 + pre_point.x;
        const ctrl_2_y = y;
        chartLine.bezierCurveTo(ctrl_1_x, ctrl_1_y, ctrl_2_x, ctrl_2_y, x, y);
      }
    }
    chartLine.moveTo(0, 0);
    // chartLine.beginFill(0, 1);
    // const first_point = point_list[0];
    const r = chart_line_width / 2;
    // chartLine.lineWidth = 0;
    // // console.log(chartLine.lineWidth / 16);
    // chartLine.drawCircle(first_point.x, first_point.y, r);
    // const last_point = point_list[point_list.length - 1];
    // chartLine.drawCircle(last_point.x, last_point.y, r);
    // chartLine.endFill();
    // 绘制渐变层
    let { chartLineGradientCover } = this;
    if (!coordinateMesh) {
      throw new Error("coordinateMesh not init");
    }
    if (!chartLineGradientCover) {
      this._chartLineGradientCanvasTexture = AniBase.createLinearGradient(chart_width / 2, 0, this.chart_line_style.gradient);
      this.chartLineGradientCover = chartLineGradientCover = PIXI.Sprite.from(this._chartLineGradientCanvasTexture);
      chartLineGradientCover.height = chart_height;
      chartLineGradientCover.width = chart_width + r * 2;
      coordinateMesh.addChild(chartLineGradientCover);
      chartLineGradientCover.position.set(chartLine.x - r, 0);
      chartLineGradientCover.mask = chartLine;
    }
    /// 实现点击聚焦曲线上的某一点
    const drawAuxiliaryLineByPoint = (point: PIXI.Point) => {
      const bounds = chartLine.getBounds();
      this._drawAuxiliaryLine(point.x - bounds.x, point.y - bounds.y);
      this.emit("refresh-frame");
    };
    let pre_tap_point: PIXI.Point | undefined;
    if (!coordinateMesh.interactive) {
      coordinateMesh.interactive = true;
      coordinateMesh.on("pointerdown", (e: PIXI.interaction.InteractionEvent) => {
        pre_tap_point = e.data.global.clone();
        drawAuxiliaryLineByPoint(pre_tap_point);
      });
    } else if (pre_tap_point) {
      drawAuxiliaryLineByPoint(pre_tap_point);
    }
  }
  private _auxiliaryLine?: PIXI.Graphics;
  private _auxiliaryLineGradientMask?: PIXI.Sprite;
  private _auxiliaryText?: PIXI.Text;
  protected _drawAuxiliaryLine(x: number, y: number) {
    let { _auxiliaryLine: auxiliaryLine, _auxiliaryLineGradientMask: auxiliaryLineGradientMask, _auxiliaryText: auxiliaryText } = this;
    const { chartLine, coordinateMesh, chart_line_width, chartLineGradientCover, point_list, padding } = this;
    if (!chartLineGradientCover) {
      throw new Error("chartLineGradientCover not init");
    }
    if (x < 0 || x > chartLineGradientCover.width) {
      return;
    }
    if (!coordinateMesh) {
      throw new Error("coordinateMesh not init");
    }
    if (!chartLine) {
      throw new Error("chartLine not init");
    }
    /// 初始化辅助线
    if (!auxiliaryLine) {
      auxiliaryLine = this._auxiliaryLine = new PIXI.Graphics();
      coordinateMesh.addChild(auxiliaryLine);
    }
    /// 初始化辅助线遮罩
    if (!auxiliaryLineGradientMask) {
      auxiliaryLineGradientMask = this._auxiliaryLineGradientMask = PIXI.Sprite.from(
        AniBase.createLinearGradient(0, this.view_height / 2, [[0, "#FFF"], [0.7, "#666"], [1, "#333"]])
      );
      auxiliaryLine.mask = auxiliaryLineGradientMask;
      auxiliaryLine.addChild(auxiliaryLineGradientMask);
    }
    /// 初始化辅助文字
    if (!auxiliaryText) {
      auxiliaryText = this._auxiliaryText = new PIXI.Text("", this.auxiliary_text_style);
      this.addChild(auxiliaryText);
      auxiliaryText.y = padding.top;
    }
    /// 开始绘制
    auxiliaryLine.clear();

    // 根据X找到一个最接近的数据点
    let _distance = Infinity;
    let near_point: PIXI.Point | undefined;
    let near_point_index = -1;
    point_list.some((p, i) => {
      const dis = Math.abs(p.x - x);
      if (_distance >= dis) {
        _distance = dis;
        if (i === point_list.length - 1) {
          near_point = p;
          near_point_index = i;
          return true;
        }
        return false;
      }
      near_point = point_list[(near_point_index = i - 1)];
      return true;
    });
    if (!near_point) {
      throw new Error("near_point not found");
    }
    // 基于这个临近点，寻找最佳临近点
    {
      const near_range_r = this.pt(20); // 寻找x轴上，在这个范围为半径内的点
      const unit_diff_x = (point_list[point_list.length - 1].x - point_list[0].x) / point_list.length;
      const near_range_index = Math.floor(near_range_r / unit_diff_x);
      const sort_able_point_list: {
        diff_i: number;
        index: number;
        point: PIXI.Point;
        dis: number;
      }[] = [];
      for (
        var i = Math.max(0, near_point_index - near_range_index), max_index = Math.min(point_list.length - 1, near_point_index + near_range_index);
        i <= max_index;
        i += 1
      ) {
        const point = point_list[i];
        sort_able_point_list.push({
          diff_i: Math.abs(i - near_range_index),
          index: i,
          point,
          dis: Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)),
        });
      }
      // 排序
      sort_able_point_list.sort((a, b) => {
        if (b.dis === a.dis) {
          return a.diff_i - b.diff_i; // index正序，越小越好
        }
        return a.dis - b.dis; // dis正序，越小越好
      });
      const near_point_info = sort_able_point_list[0];
      near_point = near_point_info.point;
      near_point_index = near_point_info.index;
    }
    const [r, g, b, a] = this.getChartLineGradientColor(near_point.x);

    /// 绘制圆圈
    {
      auxiliaryLine.lineStyle(chart_line_width / 2, (r << 16) + (g << 8) + b, a / 255);
      auxiliaryLine.beginFill(0xffffff, 1);
      auxiliaryLine.drawCircle(0, 0, chart_line_width * 1.5);
      auxiliaryLine.endFill();
    }
    /// 绘制垂线
    let v_line_height = 0;
    {
      const end_y = chartLineGradientCover.height - near_point.y;
      const start_y = chart_line_width * 1.5;
      if (end_y > start_y) {
        auxiliaryLine.moveTo(0, start_y);
        auxiliaryLine.lineTo(0, end_y);
        v_line_height = end_y - start_y;
      }
    }
    auxiliaryLine.position.set(chartLine.x + near_point.x, chartLine.y + near_point.y);
    /// 改变遮罩的形态
    {
      const ring_R = chart_line_width * 2 + chart_line_width / 2;
      auxiliaryLineGradientMask.position.set(-ring_R, -ring_R);
      auxiliaryLineGradientMask.width = ring_R + ring_R;
      auxiliaryLineGradientMask.height = ring_R + ring_R + v_line_height;
    }
    /// 绘制辅助文字内容
    {
      const itemData = this.data[near_point_index];
      auxiliaryText.text = `${itemData[1]} ; ${itemData[0]}`;
      auxiliaryText.x = this.view_width - auxiliaryText.width - this.padding.right;
    }
  }
}
