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
    if (obj instanceof PIXI.extras.TilingSprite) {
      this._effectTileStyle(obj, style, event);
    }
    /// 根据顺序来对样式进行生效, 书写样式的时候需要注意顺序
    for (var key in style) {
      switch (key) {
        case "scale":
          this._effectScaleStyle(obj, style, event);
          break;
        case "transform":
          this._effectTransformStyle(obj, style, event);
          break;
        // default:
        //   console.warn(`csslike style :'${key}' not work`);
        //   break;
      }
    }
  }
  private _effectFontStyle(text: PIXI.Text, style: CssLikeStyle, event: CssLikeRenderEvent<PIXI.Text>) {
    const { font } = style;
    if (font) {
      const calced_font = this._calcStyle(font, event);
      if (!('fontFamily' in calced_font)) {
        calced_font.fontFamily = commonFontFamily;
      }
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
      for (var key in calced_scale) {
        const val = calced_scale[key];
        /// 根据顺序来对样式进行生效, 书写样式的时候需要注意顺序
        switch (key) {
          case "maxWidth":
            container.width = Math.min(val, container.width);
            break;
          case "width":
            container.width = val;
            break;
          case "maxHeight":
            container.height = Math.min(val, container.height);
            break;
          case "height":
            container.height = val;
            break;
          case "scale":
            container.scale.set(val, val);
            break;
          default:
            console.warn(`scale style :'${key}' not work`);
            break;
        }
      }
      if ('maxWidth' in calced_scale) {
      }

    }
  }

  private _effectTileStyle<T extends PIXI.extras.TilingSprite>(tile: T, style: CssLikeStyle, event: CssLikeRenderEvent<T>) {
    const { tileScale, tilePosition } = style;
    if (tileScale) {
      const calced_tileScale = this._calcStyle(tileScale, event);
      this.__effetPointStyle(tile.tileScale, calced_tileScale, "tileScale");
    }
    if (tilePosition) {
      const calced_tilePosition = this._calcStyle(tilePosition, event);
      this.__effetPointStyle(tile.tilePosition, calced_tilePosition, "tilePosition");
    }

  }
  private __effetPointStyle(point: PIXI.Point | PIXI.ObservablePoint, style, style_name: string) {
    /// 根据顺序来对样式进行生效, 书写样式的时候需要注意顺序
    for (var key in style) {
      const val = style[key];
      switch (key) {
        case "x":
          point.x = val;
          break;
        case "y":
          point.y = val;
          break;
        case "scale":
          point.set(val, val);
          break;
        default:
          console.warn(`${style_name} style :'${key}' not work`);
          break;
      }
    }
  }

  static complieStyleFromScript(script: string) {
    const module = {
      exports: {}
    };
    // env
    Function("commonFontFamily,iconFontFamily,translateX_center", `return function (module, exports){
      ${
      script
        .replace(/`#common-font`/g, "commonFontFamily")
        .replace(/`#icon-font`/g, "iconFontFamily")
        .replace(/`#x-center`/g, "translateX_center")
      }
    }`)(commonFontFamily, iconFontFamily, translateX_center)(module, module.exports);
    return module.exports;
  }
  // 编译普通的JSobj成style对象
  static complieStyleFromObject(style: any) {
    return CssLike.complieStyleFromJSON(JSON.stringify(style));
  }
  static complieStyleFromJSON(json_str: string) {
    const micro_complie_cache = new Map<string, CssLikeStyleCalcer>();
    return JSON.parse(json_str, (_, val) => {
      if (typeof val === "string" && val.startsWith("#:")) {
        let fun = micro_complie_cache.get(val);
        if (!fun) {
          fun = Function("return " + val.substr(2)) as CssLikeStyleCalcer;
          micro_complie_cache.set(val, fun);
        }
        return fun;
      }
      return val
    });
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
  get width() {
    return this.target.width;
  }
  get height() {
    return this.target.height;
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
  get prevChildLeft() {
    const prevChild = this.prevChild as PIXI.Container;
    return prevChild.x
  }
  get prevChildRight() {
    const prevChild = this.prevChild as PIXI.Container;
    return prevChild.x + prevChild.width
  }
  get prevChildCenterX() {
    const prevChild = this.prevChild as PIXI.Container;
    return prevChild.x + prevChild.width / 2
  }
  get prevChildTop() {
    const prevChild = this.prevChild as PIXI.Container;
    return prevChild.y
  }
  get prevChildBottom() {
    const prevChild = this.prevChild as PIXI.Container;
    return prevChild.y + prevChild.height
  }
  get prevChildCenterY() {
    const prevChild = this.prevChild as PIXI.Container;
    return prevChild.y + prevChild.height / 2
  }
  get textureAspectRatio() {
    const { target } = this;
    if (!(target instanceof PIXI.Sprite)) {
      throw new TypeError("'textureAspectRatio' only work for PIXI.Sprite.")
    }
    const texture = target.texture;
    return texture.width / texture.height;
  }
}

//#region 样式的类型定义
export type CssLikeStyleCalcer<R=any, T extends PIXI.Container=PIXI.Container> = (this: CssLikeRenderEvent<T>) => R
export const translateX_center: CssLikeStyleCalcer = function () {
  return this.W / 2 - this.target.width / 2
}

export type CssLikeStyle = CssLikeFontStyle
  & CssLikeTransformStyle
  & CssLikeScaleStyle
  & CssLikeTileStyle;
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
export type CssLikeTileStyle = {
  tileScale?: {
    x: CssLikeStyleCalcer | number,
    y: CssLikeStyleCalcer | number,
    scale: CssLikeStyleCalcer | number,
  };
  tilePosition?: {
    x: CssLikeStyleCalcer | number,
    y: CssLikeStyleCalcer | number,
    scale: CssLikeStyleCalcer | number,
  };
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
