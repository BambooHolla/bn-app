const _label_width_cache = new Map<string, number>();
/*缓存一些固定文本的宽度，避免重复计算*/
export function getLabelWidth(pixi_text: PIXI.Text) {
  const { text } = pixi_text;
  var width = _label_width_cache.get(text);
  if (typeof width !== "number") {
    width = pixi_text.width;
    _label_width_cache.set(text, width);
  }
  return width;
}
export { commonFontFamily, iconFontFamily } from '../CssLike';
