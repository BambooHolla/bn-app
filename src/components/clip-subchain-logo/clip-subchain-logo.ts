import { Component } from "@angular/core";
import { ClipAssetsLogoComponent } from "../clip-assets-logo/clip-assets-logo";

@Component({
	selector: "clip-subchain-logo",
	templateUrl: "clip-subchain-logo.html",
})
export class ClipSubchainLogoComponent extends ClipAssetsLogoComponent {
	mask_edge_outter_shape = PIXI.Sprite.from("./assets/imgs/subchain/issuing/subchain-logo-shape-w-large.jpg");
	mask_edge_inner_shape = PIXI.Sprite.from("./assets/imgs/subchain/issuing/subchain-logo-shape-b-large.png");
	mask_layer_shape = PIXI.Sprite.from("./assets/imgs/subchain/issuing/subchain-logo-shape-b-large.jpg");
	getClipSize(size: number) {
		const rate = 45 / 50; // 2r = 450px in 500px
		return {
			view_width: size * rate,
			view_height: size * rate,
		};
	}
}
