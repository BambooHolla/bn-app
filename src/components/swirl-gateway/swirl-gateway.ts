import { Component, ViewChild, ElementRef, ChangeDetectionStrategy } from "@angular/core";
import { AniBase, Easing } from "../AniBase";
import * as PIXI from "pixi.js";

@Component({
	selector: "swirl-gateway",
	templateUrl: "swirl-gateway.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwirlGatewayComponent extends AniBase {
	@ViewChild("canvas") canvasRef!: ElementRef;

	constructor() {
		super();
		this.on("init-start", this.initPixiApp.bind(this));
		this.on("start-animation", this.startPixiApp.bind(this));
		this.on("stop-animation", this.stopPixiApp.bind(this));
		this.force_update = true;
	}
	_init() {
		this.canvasNode || (this.canvasNode = this.canvasRef.nativeElement as HTMLCanvasElement);
		return super._init();
	}

	initPixiApp() {
		if (this.app) {
			this._resetApp(this.app);
		}

		const { canvasNode, pt } = this;
		if (!canvasNode) {
			throw new Error("call init first");
		}
		if (!this.app) {
			this.app = this.PIXIAppbuilder({
				antialias: true,
				transparent: true,
				view: canvasNode,
				height: pt(canvasNode.clientHeight),
				width: pt(canvasNode.clientWidth),
				autoStart: false,
			});
		}
	}

	private _resetApp(app: PIXI.Application) {
		app.stage.children.slice().forEach(child => child.destroy());
		this._loop_runs.length = 0;
	}

	updateView() {
		const { app } = this;
		if (!app) {
			return;
		}
		// 销毁旧元素
		this._resetApp(app);

		const shaderVertex = `
			attribute vec2 aVertexPosition;
			attribute vec2 aTextureCoord;
			uniform mat3 projectionMatrix;
			varying vec2 vTextureCoord;

			void main(void)
			{
				gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
				vTextureCoord = aTextureCoord;
			}
		`;

		const shaderFrag = `
		varying vec2 vTextureCoord;
		uniform sampler2D uSampler;
		uniform float radius;
		uniform float angle;
		uniform vec2 offset;
		uniform vec4 filterArea;
		vec2 mapCoord( vec2 coord ){
			coord *= filterArea.xy;
			coord += filterArea.zw;
			return coord;
		}

		vec2 unmapCoord( vec2 coord ){
			coord -= filterArea.zw;
			coord /= filterArea.xy;
			return coord;
		}
		vec2 twist(vec2 coord){
			coord -= offset;
			float dist = length(coord);
			if (dist < radius){
				float ratioDist = (radius - dist) / radius;
				float angleMod = ratioDist * ratioDist * angle;
				float s = sin(angleMod);
				float c = cos(angleMod);
				coord = vec2(coord.x * c - coord.y * s, coord.x * s + coord.y * c);
			}
			coord += offset;
			return coord;
		}
		void main(void){
			vec2 coord = mapCoord(vTextureCoord);
			coord = twist(coord);
			coord = unmapCoord(coord);
			gl_FragColor = texture2D(uSampler, coord );
		}`;

		const { renderer } = app;
		const container = new PIXI.Container();
		app.stage.addChild(container);
		//container.filterArea = app.screen;

		// 材质
		var sprite = PIXI.Sprite.fromImage("./assets/imgs/tutorial/3.jpg");
		sprite.width = app.screen.width;
		sprite.height = app.screen.height;
		container.addChild(sprite);

		// 着色器
		var filter = new PIXI.Filter<{
			offset: [number, number];
			radius: number;
			angle: number;
		}>(shaderVertex, shaderFrag);
		container.filters = [filter];

		filter.uniforms.offset = [renderer.width / 2, renderer.height * 0.382];
		filter.uniforms.radius = 0;
		filter.uniforms.angle = 0;
		const angle_speed = 0.002;
		const canvasEle = this.canvasRef.nativeElement as HTMLCanvasElement;
		const radius_speed = 0.001 * canvasEle.clientHeight;

		// Animate the filter
		app.ticker.add(function tick(delta) {
			if (!container.parent) {
				app.ticker.remove(tick);
				return;
			}

			filter.uniforms.radius += radius_speed;
			filter.uniforms.angle += angle_speed;
		});
	}

	startPixiApp() {
		this.app && this.app.start();
	}

	stopPixiApp() {
		this.app && this.app.stop();
	}
}
