import * as PIXI from "pixi.js";
import {BlockCard} from './block-card';

export class CardChain extends PIXI.Container {
  static bg_resource: PIXI.Texture;
  get bg_resource() {
    return (this.constructor as typeof BlockCard).bg_resource;
  }
  constructor(public W: number, public H: number) {
    super();
    this.drawChain();
    this.addChild(this.left_chain);
    this.addChild(this.right_chain);
    this.cacheAsBitmap = true;
  }
  left_chain = new PIXI.Graphics();
  right_chain = new PIXI.Graphics();
  drawChain() {
    const { left_chain, right_chain, W } = this;
    this._drawChainItem(left_chain);
    this._drawChainItem(right_chain);

    left_chain.x = W * 0.1;
    right_chain.x = W - left_chain.x - right_chain.width;
    this.right_chain = right_chain;
  }
  private _drawChainItem(parent: PIXI.Container) {
    const { W, H } = this;
    const unit_w = W * 0.1;
    const unit_h = H;
    // 直接使用贴图
    const s = new PIXI.Sprite(this.bg_resource);
    parent.addChild(s);
    s.height = H * 0.25;
    s.scale.x = s.scale.y;
    parent.addChild(s);
  }
}
