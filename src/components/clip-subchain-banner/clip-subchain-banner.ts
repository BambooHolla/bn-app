import { Component } from "@angular/core";
import { ClipAssetsLogoComponent } from "../clip-assets-logo/clip-assets-logo";

@Component({
	selector: "clip-subchain-banner",
	templateUrl: "clip-subchain-banner.html",
})
export class ClipSubchainBannerComponent extends ClipAssetsLogoComponent {
	mask_edge_outter_shape = PIXI.Sprite.from("./assets/imgs/subchain/issuing/subchain-banner-shape-w-large.jpg");
	mask_edge_inner_shape = PIXI.Sprite.from("./assets/imgs/subchain/issuing/subchain-banner-shape-b-large.png");
	mask_layer_shape = PIXI.Sprite.from("./assets/imgs/subchain/issuing/subchain-banner-shape-b-large.jpg");
	getClipSize(size: number) {
		return {
			view_width: size,
			view_height: (size * 24) / 70,
		};
	}
}
