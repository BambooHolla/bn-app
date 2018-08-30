import {
	Component,
	ViewChild,
	ElementRef,
	ChangeDetectionStrategy,
	OnDestroy
} from "@angular/core";

import { AniBase, Easing, formatImage } from "../AniBase";
import * as PIXI from "pixi.js";

enum OpType {
	none,
	move, // 单个手指
	resize, // 两个手指
}

@Component({
	selector: "clip-assets-logo",
	templateUrl: "clip-assets-logo.html",
})
export class ClipAssetsLogoComponent extends AniBase{
	@ViewChild("canvas") canvasRef!: ElementRef;
	constructor() {
		super();
		this.on("init-start", this.initPixiApp.bind(this));
		this.force_update = true;
	}

	_init() {
		const canvasNode: HTMLCanvasElement =
			this.canvasNode || (this.canvasNode = this.canvasRef.nativeElement);
		return super._init();
	}

	initPixiApp() {
		if (this.app) {
			this.app.stage.children.slice().forEach(child => {
				return child.destroy();
			});
			this._loop_runs.length = 0;
		} else {
			const { pt, px, canvasNode } = this;
			if (!canvasNode) {
				throw new Error("call init first");
			}
			const w = canvasNode.parentElement
				? canvasNode.parentElement.clientWidth
				: canvasNode.clientWidth;

			const h = canvasNode.parentElement
				? canvasNode.parentElement.clientHeight
				: canvasNode.clientHeight;

			this.app = ClipAssetsLogoComponent.PIXIAppbuilder({
				view: canvasNode,
				width: pt(w),
				height: pt(h),
				transparent: false,
				antialias: false,
				autoStart: true,
				backgroundColor: 0xffffff,
			});
		}

		this._draw_init();
	}

	_draw_init() {
		if (!this.app) {
			return;
		}
		const { renderer, stage } = this.app;
		const { width: W, height: H } = renderer;
		const W_2 = W / 2;
		const H_2 = H / 2;

		const {
			logo_container,
			mask_container,
			mask_layer_drawer,
			mask_layer_shape,
		} = this;
		// 绘制顶部遮罩
		mask_container.beginFill(0x999999, 0.9);
		mask_container.drawRect(0, 0, W, H);
		mask_container.endFill();
		// mask_container.mask = mask_layer;

		mask_layer_drawer.beginFill(0xffffff, 1);
		mask_layer_drawer.drawRect(0, 0, W, H);
		mask_layer_drawer.endFill();
		mask_layer_drawer.addChild(mask_layer_shape);
		// mask_layer.mask = mask_layer_mask;
		const init_mask_layer_mask = () => {
			if (mask_layer_shape.width <= 1) {
				return;
			}
			mask_layer_drawer.visible = true;
			// mask_layer.cacheAsBitmap = false;
			mask_layer_shape.width = W;
			mask_layer_shape.height = H;
			const min_wh_scale = Math.min(
				mask_layer_shape.scale.x,
				mask_layer_shape.scale.y
			);
			mask_layer_shape.scale.x = min_wh_scale;
			mask_layer_shape.scale.y = min_wh_scale;

			mask_layer_shape.x = (W - mask_layer_shape.width) / 2;
			mask_layer_shape.y = (H - mask_layer_shape.height) / 2;
			// mask_layer.cacheAsBitmap = true;
			const mask_container_mask = new PIXI.Sprite(
				mask_layer_drawer.generateCanvasTexture()
			);

			if (mask_container.mask) {
				mask_container.mask.destroy();
			}
			mask_container.mask = mask_container_mask;
			stage.addChild(mask_container_mask);
			mask_layer_drawer.visible = false;
		};
		init_mask_layer_mask();
		mask_layer_shape.texture.on("update", init_mask_layer_mask);
		// mask_layer_mask.pivot.set(W_2, H_2);
		// mask_layer_mask.position.set(W_2, H_2);

		const RATE = W / H;

		stage.addChild(mask_container);
		mask_container.addChild(mask_layer_drawer);
		// this._init_edge_container();
		this._init_logo_container();
	}
	logo_container = new PIXI.Graphics();

	mask_container = new PIXI.Graphics();
	mask_edge_container = new PIXI.Graphics();
	mask_edge_drawer = new PIXI.Graphics();
	// mask_edge_white_inner_drawer = new PIXI.Graphics();
	// mask_edge_white_inner_shape = PIXI.Sprite.from(
	// 	"./assets/assets-logo-shape-b-large.jpg"
	// );
	mask_edge_outter_shape = PIXI.Sprite.from(
		"./assets/imgs/assets/assets-logo-shape-w-large.jpg"
	);
	mask_edge_inner_shape = PIXI.Sprite.from(
		"./assets/imgs/assets/assets-logo-shape-b-large.png"
	);
	mask_layer_drawer = new PIXI.Graphics();
	mask_layer_shape = PIXI.Sprite.from(
		"./assets/imgs/assets/assets-logo-shape-b-large.jpg"
	);

	white_edge_size = 0.1; // 白边的百分比

	private _init_edge_container() {
		if (!this.app) {
			return;
		}
		const { renderer, stage } = this.app;
		const { width: W, height: H } = renderer;
		const W_2 = W / 2;
		const H_2 = H / 2;

		const {
			mask_edge_container,
			mask_edge_drawer,
			// mask_edge_white_inner_drawer,
			// mask_edge_white_inner_shape,
			white_edge_size,
			mask_edge_outter_shape,
			mask_edge_inner_shape,
			// mask_edge_white_shape,
		} = this;
		// 绘制白边层
		mask_edge_container.beginFill(0xffffff, 1);
		mask_edge_container.drawRect(0, 0, W, H);
		mask_edge_container.endFill();

		// 绘制遮罩层
		mask_edge_drawer.beginFill(0x0, 1);
		mask_edge_drawer.drawRect(0, 0, W, H);
		mask_edge_drawer.endFill();

		// // 绘制遮罩层的遮罩层
		// mask_edge_white_inner_drawer.beginFill(0xffffff, 1);
		// mask_edge_white_inner_drawer.drawRect(0, 0, W, H);
		// mask_edge_white_inner_drawer.endFill();

		const is_mask_edge_drawer_done = new Set(["outter", "inner"]);
		// edge mask
		const init_mask_edge_drawer = () => {
			if (is_mask_edge_drawer_done.size !== 0) {
				return;
			}
			const mask_edge_mask = new PIXI.Sprite(
				mask_edge_drawer.generateCanvasTexture()
			);

			mask_edge_container.addChild(mask_edge_mask);
			mask_edge_container.mask = mask_edge_mask;
			mask_edge_drawer.visible = false;
		};

		//outter
		const init_mask_edge_outter_shape = () => {
			if (
				mask_edge_outter_shape.texture.width <= 1 ||
				is_mask_edge_drawer_done.has("inner") ||
				!is_mask_edge_drawer_done.has("outter")
			) {
				return;
			}

			mask_edge_outter_shape.width = W;
			mask_edge_outter_shape.height = H;
			const min_wh_scale = Math.min(
				mask_edge_outter_shape.scale.x,
				mask_edge_outter_shape.scale.y
			);
			mask_edge_outter_shape.scale.x = min_wh_scale;
			mask_edge_outter_shape.scale.y = min_wh_scale;

			mask_edge_outter_shape.x = (W - mask_edge_outter_shape.width) / 2;
			mask_edge_outter_shape.y = (H - mask_edge_outter_shape.height) / 2;

			is_mask_edge_drawer_done.delete("outter");
			// console.log("outter done");
			init_mask_edge_drawer();
		};
		mask_edge_outter_shape.texture.on(
			"update",
			init_mask_edge_outter_shape
		);

		const init_mask_edge_inner_shape = () => {
			if (
				mask_edge_outter_shape.texture.width <= 1 ||
				!is_mask_edge_drawer_done.has("inner")
			) {
				return;
			}

			mask_edge_inner_shape.width = W;
			mask_edge_inner_shape.height = H;
			const min_wh_scale = Math.min(
				mask_edge_inner_shape.scale.x,
				mask_edge_inner_shape.scale.y
			);
			mask_edge_inner_shape.scale.set(
				min_wh_scale * (1 - white_edge_size)
			);

			mask_edge_inner_shape.x = (W - mask_edge_inner_shape.width) / 2;
			mask_edge_inner_shape.y = (H - mask_edge_inner_shape.height) / 2;
			is_mask_edge_drawer_done.delete("inner");
			// console.log("inner done");
			init_mask_edge_outter_shape();
		};
		mask_edge_inner_shape.texture.on("update", init_mask_edge_inner_shape);
		init_mask_edge_inner_shape();

		mask_edge_container.addChild(mask_edge_drawer);
		mask_edge_drawer.addChild(mask_edge_outter_shape);
		mask_edge_drawer.addChild(mask_edge_inner_shape);

		// mask_edge_container.mask = this.mask_container.mask;
		this.logo_container.addChild(mask_edge_container);
		// this.logo_container.addChild(this.export_layer);
	}
	private _init_logo_container() {
		if (!this.app) {
			return;
		}
		const { renderer, stage } = this.app;
		const { width: W, height: H } = renderer;
		const W_2 = W / 2;
		const H_2 = H / 2;

		const { logo_container } = this;
		logo_container.interactive = true;
		logo_container.beginFill(0xffffff, 1);
		logo_container.drawRect(0, 0, W, H);
		logo_container.endFill();

		// 初始化默认图标
		this._set_logo(this.logo_url);

		let status = OpType.none;
		let init_point_1: PIXI.Point;
		let init_point_2: PIXI.Point;
		let move_init_point: PIXI.Point;
		let resize_init_scale: number;
		let resize_distance: number;
		let resize_rule = Math.max(W, H) / 6; // 多少像素放大0.1

		logo_container.on(
			"pointerdown",
			(e: PIXI.interaction.InteractionEvent) => {
				if (!this.logo) {
					return;
				}
				// console.log(
				// 	"touches" in e.data.originalEvent &&
				// 		[].slice.call(e.data.originalEvent.touches)
				// );
				if (
					e.data.pointerType === "touch" &&
					"touches" in e.data.originalEvent &&
					e.data.originalEvent.touches.length === 2
				) {
					status = OpType.resize;
					const point_1 = e.data.originalEvent.touches[0];
					const point_2 = e.data.originalEvent.touches[1];
					init_point_1 = new PIXI.Point(
						point_1.clientX,
						point_1.clientY
					);
					init_point_2 = new PIXI.Point(
						point_2.clientX,
						point_2.clientY
					);
					resize_distance = Math.sqrt(
						Math.pow(init_point_2.x - init_point_1.x, 2) +
							Math.pow(init_point_2.y - init_point_1.y, 2)
					);
					resize_init_scale = this.logo.scale.x;
				} else {
					status = OpType.move;
					init_point_1 = e.data.global.clone();
					move_init_point = new PIXI.Point(
						this.logo.position.x,
						this.logo.position.y
					);
				}
			}
		);
		// 移动
		logo_container.on(
			"pointermove",
			(e: PIXI.interaction.InteractionEvent) => {
				if (!this.logo) {
					return;
				}
				if (status === OpType.move) {
					const current_point = e.data.global.clone();
					const diff_x = current_point.x - init_point_1.x;
					const diff_y = current_point.y - init_point_1.y;
					this.logo.position.set(
						move_init_point.x + diff_x,
						move_init_point.y + diff_y
					);
					// 边界限制
					if (this.logo.position.x < 0) {
						this.logo.position.x = 0;
					}
					if (this.logo.position.x > W) {
						this.logo.position.x = W;
					}
					if (this.logo.position.y < 0) {
						this.logo.position.y = 0;
					}
					if (this.logo.position.y > H) {
						this.logo.position.y = H;
					}
				} else if (
					status === OpType.resize &&
					e.data.pointerType === "touch" &&
					"touches" in e.data.originalEvent &&
					e.data.originalEvent.touches.length === 2
				) {
					const point_1 = e.data.originalEvent.touches[0];
					const point_2 = e.data.originalEvent.touches[1];
					init_point_1 = new PIXI.Point(
						point_1.clientX,
						point_1.clientY
					);
					init_point_2 = new PIXI.Point(
						point_2.clientX,
						point_2.clientY
					);
					const current_distance = Math.sqrt(
						Math.pow(init_point_2.x - init_point_1.x, 2) +
							Math.pow(init_point_2.y - init_point_1.y, 2)
					);
					const diff_scale =
						(current_distance - resize_distance) / resize_rule;
					const target_scale = Math.max(
						resize_init_scale + diff_scale,
						0
					);
					this.logo.scale.set(target_scale);
					// 缩放限制
					if (this.logo.height < this.min_size) {
						this.logo.height = this.min_size;
						this.logo.scale.x = this.logo.scale.y;
					}
					if (this.logo.width < this.min_size) {
						this.logo.width = this.min_size;
						this.logo.scale.y = this.logo.scale.x;
					}
				}
			}
		);

		// 添加到最底层
		stage.addChildAt(logo_container, 0);
	}

	min_size = 32; // 至少要32px
	public logo_url = "";
	logo?: PIXI.Sprite;
	set_logo_url(logo_url: string) {
		if (logo_url === this.logo_url) {
			return;
		}
		this.logo_url = logo_url;
		this._set_logo(logo_url);
		// this.logo.texture.baseTexture = new PIXI
	}

	private _set_logo(url) {
		if (!this.app) {
			return;
		}
		if (this.logo) {
			this.logo.destroy();
		}
		this.logo = PIXI.Sprite.from(url);
		const { width: W, height: H } = this.app.renderer;

		const on_logoContainer_update = () => {
			const { logo } = this;
			// console.log(logo.texture.width);
			if (logo.texture.width <= 1) {
				return;
			}
			logo.pivot.set(logo.texture.width / 2, logo.texture.height / 2);
			logo.width = W;
			logo.height = H;

			/// size: container
			const min_scale = Math.min(logo.scale.x, logo.scale.y);
			logo.scale.x = logo.scale.y = min_scale;
			// console.log(logo.width,logo.height)
			logo.x = W / 2; //(W - logo.width) / 2;
			logo.y = H / 2; //(H - logo.height) / 2;
			// console.log(W, H, logo.x, logo.y);

			this.logo_container.addChildAt(logo, 0);
			this._target_rotation = 0;
		};
		this.logo.texture.on("update", on_logoContainer_update);
		on_logoContainer_update();
		return this.logo;
	}
	private _target_rotation = 0;
	private _rotation_aborter?: Function;
	private _rotateLogoDeg(deg) {
		const { logo } = this;
		if (logo) {
			this._target_rotation += deg;
			if (this._rotation_aborter) {
				this._rotation_aborter();
				this._rotation_aborter = undefined;
			}
			AniBase.animateNumber(
				logo.rotation,
				this._target_rotation,
				250,
				Easing.Quadratic_Out
			)(
				(v, abort) => {
					logo.rotation = v;
					this._rotation_aborter = abort;
				},
				() => {
					this._rotation_aborter = undefined;
				}
			);
		}
	}
	rotateClockwise90deg() {
		return this._rotateLogoDeg(Math.PI / 2);
	}
	rotateLeft90deg = this.rotateClockwise90deg;
	rotateCounterclockwise90deg() {
		return this._rotateLogoDeg(-Math.PI / 2);
	}
	rotateRight90deg = this.rotateCounterclockwise90deg;
	resetLogo() {
		if (this._rotation_aborter) {
			this._rotation_aborter();
			this._rotation_aborter = undefined;
		}
		this._set_logo(this.logo_url);
	}
	setBg(bg_color) {
		const { logo_container } = this;
		logo_container.beginFill(parseInt(bg_color.replace("#", ""), 16), 1);
		logo_container.drawRect(
			0,
			0,
			logo_container.width,
			logo_container.height
		);
		logo_container.endFill();
	}

	clip_layer_shape = PIXI.Sprite.from(
		"./assets/imgs/assets/assets-logo-shape-w-large.jpg"
	);

	// export_layer = new PIXI.Container();

	// 导出裁剪的图形
	async exportClipBase64() {
		if (!this.app) {
			return;
		}
		const { clip_layer_shape, mask_layer_shape } = this;
		if (this.logo_container.mask != clip_layer_shape) {
			this.logo_container.mask = clip_layer_shape;
			this.logo_container.addChild(clip_layer_shape);
			// const { width: W, height: H } = this.app.renderer;
			clip_layer_shape.width = mask_layer_shape.width;
			clip_layer_shape.height = mask_layer_shape.height;
			clip_layer_shape.x = mask_layer_shape.x;
			clip_layer_shape.y = mask_layer_shape.y;
			// this.export_layer.addChild(this.logo_container);
			// const size = Math.min(
			// 	this.logo_container.width,
			// 	this.logo_container.height
			// );
			// this.export_layer.width = size;
			// this.export_layer.height = size;
			// this.logo_container.x = (size - this.logo_container.width) / 2;
			// this.logo_container.y = (size - this.logo_container.height) / 2;
		}

		// this.logo_container.generateCanvasTexture()
		const export_base64 = this.app.renderer.extract.base64(
			this.logo_container
		);
		this.logo_container.mask = null;
		this.logo_container.removeChild(clip_layer_shape);
		// this.logo_container.x = 0;
		// this.logo_container.y = 0;
		// this.app.stage.addChild(this.logo_container)
		const size = Math.min(
			this.logo_container.width,
			this.logo_container.height
		);
		return await formatImage(export_base64, {
			format: "image/png",
			view_width: size,
			view_height: size,
			size: "cover",
			position: "center",
			target_encode: "base64",
		}) as string;
	}
	async exportClipBolb() {
		const export_base64 = await this.exportClipBase64();
		if (!export_base64) {
			return;
		}

		const contentType = "image/png";
		const sliceSize = /*sliceSize || */ 512;
		const b64Data = export_base64.split(",")[1];
		const byteCharacters = atob(b64Data);
		const byteArrays: Uint8Array[] = [];

		for (
			var offset = 0;
			offset < byteCharacters.length;
			offset += sliceSize
		) {
			const slice = byteCharacters.slice(offset, offset + sliceSize);

			const byteNumbers = new Array(slice.length);
			for (var i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}

			byteArrays.push(new Uint8Array(byteNumbers));
		}

		const blob = new Blob(byteArrays, { type: contentType });
		return blob;
	}
	async exportClipBolbUrl() {
		return URL.createObjectURL(await this.exportClipBolb());
	}
}
