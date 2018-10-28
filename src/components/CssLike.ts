import { AniBase } from "./AniBase";
export class CssLike extends AniBase {
  private _calcStyle(style: any, event: CssLikeRenderEvent) {
    const { width: W, height: H } = this.app!.renderer;
    const calced_style: any = {};
    for (var key in style) {
      const des = Object.getOwnPropertyDescriptor(style, key);
      if (!des) {
        continue;
      }
      if ('value' in des) {
        const val = des.value;
        if (typeof val === 'function') {
          calced_style[key] = val.call(event);
        } else {
          calced_style[key] = val;
        }
      } else if (des.get) {
        calced_style[key] = des.get.call(event);
      }
    }
    return calced_style;
  }
  effectStyle<T extends PIXI.Container>(obj: T, style: CssLikeStyle) {
    const event = new CssLikeRenderEvent<any>(this, obj)
    if (obj instanceof PIXI.Text) {
      this._effectFontStyle(obj, style, event);
    }
    this._effectTransformStyle(obj, style, event);
    this._effectScaleStyle(obj, style, event);
  }
  private _effectFontStyle(text: PIXI.Text, style: CssLikeStyle, event: CssLikeRenderEvent<PIXI.Text>) {
    const { font } = style;
    if (font) {
      const calced_font = this._calcStyle(font, event);
      Object.assign(text.style, calced_font);
    }
  }
  private _effectTransformStyle<T extends PIXI.Container>(container: T, style: CssLikeStyle, event: CssLikeRenderEvent<T>) {
    const { transform } = style;
    if (transform) {
      const calced_transform = this._calcStyle(transform, event);
      if ('translateX' in calced_transform) {
        container.x = calced_transform.translateX;
      }
      if ('translateY' in calced_transform) {
        container.y = calced_transform.translateY;
      }
    }
  }
  private _effectScaleStyle<T extends PIXI.Container>(container: T, style: CssLikeStyle, event: CssLikeRenderEvent<T>) {
    const { scale } = style;
    if (scale) {
      const calced_scale = this._calcStyle(scale, event);
      if ('maxWidth' in calced_scale) {
        container.width = Math.min(calced_scale.maxWidth, container.width);
      }

    }
  }
}

/**渲染一个对象的委托组合对象 */
class CssLikeRenderEvent<T extends PIXI.Container = PIXI.Container>{
  constructor(
    public instance: AniBase,
    public target: T,
    public W = instance.W,
    public H = instance.H,
  ) {
  }
  get prevChild() {
    const parent = this.target.parent;
    const index = parent.children.indexOf(this.target);
    return parent.children[index - 1];
  }
  get nextChild() {
    const parent = this.target.parent;
    const index = parent.children.indexOf(this.target);
    return parent.children[index + 1];
  }
  get prevChildRight() {
    const prevChild = this.prevChild as PIXI.Container;
    return prevChild.x + prevChild.width
  }
  get prevChildBottom() {
    const prevChild = this.prevChild as PIXI.Container;
    return prevChild.y + prevChild.height
  }
}

//#region 样式的类型定义
export type CssLikeStyleCalcer<R=any, T extends PIXI.Container=PIXI.Container> = (this: CssLikeRenderEvent<T>) => R
export const translateX_center: CssLikeStyleCalcer = function () {
  return this.W / 2 - this.target.width / 2
}

export type CssLikeStyle = CssLikeFontStyle & CssLikeTransformStyle & CssLikeScaleStyle;
export type CssLikeFontStyle = {
  font?: {
    [P in keyof PIXI.TextStyle]?: PIXI.TextStyle[P] | CssLikeStyleCalcer<PIXI.TextStyle[P], PIXI.Text>;
  };
}
export type CssLikeTransformStyle = {
  transform?: {
    translateX?: CssLikeStyleCalcer;
    translateY?: CssLikeStyleCalcer;
  }
}
export type CssLikeScaleStyle = {
  scale?: {
    maxWidth?: CssLikeStyleCalcer
  }
}
//#endregion


/**图标字体 */
export const commonFontFamily = [
  "-apple-system",
  "SF Compact Display",
  "Helvetica Neue",
  "Roboto",
  "sans-serif",
];
export const iconFontFamily = ["ifmicon", ...commonFontFamily];
