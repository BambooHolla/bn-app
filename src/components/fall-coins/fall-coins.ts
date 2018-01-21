import { Component, ViewChild, ElementRef } from "@angular/core";
import { PromiseOut } from "../../bnqkl-framework/PromiseExtends";
import { AniBase } from "../AniBase";
import * as PIXI from "pixi.js";

@Component({
	selector: "fall-coins",
	templateUrl: "fall-coins.html",
})
export class FallCoinsComponent extends AniBase {
	app: PIXI.Application;
	@ViewChild("canvas") canvasRef: ElementRef;

	_init() {
		if (!this._load_resource_promiseout) {
			this._load_resource_promiseout = new PromiseOut();
			for (const asset of this._coin_assets) {
				PIXI.loader.add(asset.name, asset.url);
			}
			PIXI.loader.onLoad.add(() => {
				this._load_resource_promiseout.resolve(PIXI.loader.resources);
			});
			PIXI.loader.onError.add(err =>
				this._load_resource_promiseout.reject(err),
			);
			PIXI.loader.load();
		}
		this.canvasNode || (this.canvasNode = this.canvasRef.nativeElement);
		return super._init();
	}
	constructor() {
		super();
		this.on("init-start", this.initPixiApp.bind(this));
		this.on("start-animation", this.startPixiApp.bind(this));
		this.on("stop-animation", this.stopPixiApp.bind(this));
	}
	// 72pt = 1英寸 = 2.54 厘米
	// 1m = 2834.645669291339 pt
	// gravity = 0.9 * this.pt(2834.645669291339); //重力加速度: px/s
	gravity = 500; //重力加速度: px/s
	async initPixiApp() {
		if (this.app) {
			this.app.destroy();
			this.app = null;
		}
		const {
			pt,
			px,
			canvasNode,
			_progress_coins_config,
			_coin_assets,
			progress_coins,
			gravity,
		} = this;
		const app = (this.app = new PIXI.Application({
			transparent: true,
			view: canvasNode,
			height: pt(canvasNode.clientHeight),
			width: pt(canvasNode.clientWidth),
			autoStart: false,
		}));
		const resources = await this._load_resource_promiseout.promise;
		console.log("resources", resources);
		// 处理resource成动画帧
		const frames_list: Array<PIXI.Texture[]> = [];
		for (let asset of this._coin_assets) {
			const resource = resources[asset.name];
			const baseTexture = new PIXI.BaseTexture(resource.data);
			const frames: PIXI.Texture[] = [];
			const u_width = asset.info.width;
			const u_height = asset.info.height / asset.info.frame_num;
			for (let i = 0; i < asset.info.frame_num; i += 1) {
				frames.push(
					new PIXI.Texture(
						baseTexture,
						new PIXI.Rectangle(0, u_height * i, u_width, u_height),
					),
				);
			}
			frames_list.push(frames);
			// const ani = new PIXI.extras.AnimatedSprite(frames);
			// ani.animationSpeed = 1;
		}

		const { useable_lines, full_lines } = _progress_coins_config;

		const { stage, renderer, ticker } = app;
		const u_size = renderer.width / 6;

		const container = new PIXI.Container();
		// container.position.set(renderer.width / 2, renderer.height);
		stage.addChild(container);
		const indexContainerMap = new Map<string, PIXI.Container>();
		const getContainerByIndexAndId = (index: number, id: number) => {
			const key = index + "-" + id;
			var con = indexContainerMap.get(key);
			if (!con) {
				con = new PIXI.Container();
				con["zIndex"] = index;
				container.addChild(con);
				container.children.sort(function(a, b) {
					return b["zIndex"] - a["zIndex"];
				});
				indexContainerMap.set(key, con);
			}
			return con;
		};

		const auto_fall_down = t => {
			// if (t / 200 <= progress_coins.length) {
			// 	return;
			// }
			const target_line =
				useable_lines[(Math.random() * useable_lines.length) | 0];
			if (!target_line) {
				this.removeLoop(auto_fall_down);
				return;
			}

			var speed = 0;
			const frames =
				frames_list[(Math.random() * frames_list.length) | 0];
			const ani = new PIXI.extras.AnimatedSprite(frames);
			ani.width = u_size;
			ani.height = u_size;
			// ani.animationSpeed = Math.random() + 0.5; // 金币的旋转速度
			ani.animationSpeed = 1; // 金币的旋转速度

			ani.x = target_line.x * renderer.width;
			ani.y = -u_size * 2;
			const parent = getContainerByIndexAndId(
				target_line.y,
				target_line._id,
			);
			parent.addChild(ani);

			progress_coins.push(ani);
			/*计算出最终落点*/
			const end_y =
				renderer.height * 0.95 -
				u_size -
				(target_line.cur + target_line.y) * u_size / 5;

			/*距离*/
			const diff_y = end_y - ani.y;
			/*根据加速度与距离算出时间 a*t*t=y*2 */
			const total_time = Math.pow(diff_y * 2 / gravity, 0.5);
			/*假设每帧的时间固定*/
			const u_frame_ms = 20;
			/*可以推算出帧数，要超出终点才停止，所以多出来的一帧*/
			const ani_frame_num = Math.ceil(total_time * 1000 / u_frame_ms);
			/*总帧数 36, 目标帧为24,可以算出起始的帧*/
			const start_frame = 36 - (ani_frame_num - 26) % 36;

			ani.gotoAndStop(start_frame);

			var _f = 0;
			// 增加下落的动画
			const coin_ani = (t, diff_time) => {
				ani.gotoAndStop(ani.currentFrame + 1);
				// const add_speed = diff_time / 1000;
				const diff_second = u_frame_ms / 1000; //使用固定的时间，使得下落点可预测
				const add_speed = gravity * diff_second;
				const pre_speed = speed;
				speed += add_speed;
				ani.y += (pre_speed + speed) / 2 * diff_second;

				// 到达终点，停止动画，并固定这一帧的结果
				if (ani.y >= end_y) {
					ani.y = end_y;
					this.removeLoop(coin_ani);
					target_line.in_ani -= 1;
				}
				if (target_line.in_ani === 0) {
					parent.cacheAsBitmap = true;
				}
			};
			if (target_line.in_ani === 0) {
				parent.cacheAsBitmap = false;
			}
			target_line.in_ani += 1;
			// 开始动画
			this._loop_runs.push(coin_ani);

			target_line.cur += 1;
			if (target_line.cur >= target_line.max) {
				// console.log("完成line", target_line);
				full_lines.push(target_line);
				useable_lines.splice(useable_lines.indexOf(target_line), 1);
			}
		};
		this._loop_runs.push(auto_fall_down);
	}
	startPixiApp() {
		this.app.start();
	}

	stopPixiApp() {
		this.app.stop();
	}

	private _progress_coins_config = {
		useable_lines: [
			// 底行
			{
				y: 1,
				x: 0.2 * 0,
				max: 6,
			},
			{
				y: -1,
				x: 0.2 * 1,
				max: 7,
			},
			{
				y: -1,
				x: 0.2 * 2,
				max: 9,
			},
			{
				y: -1,
				x: 0.2 * 3,
				max: 8,
			},
			{
				y: 1,
				x: 0.2 * 4,
				max: 5,
			},
			// 第二行
			{
				y: 4,
				x: 0.2 * 0.5,
				max: 7,
			},
			{
				y: 3,
				x: 0.2 * 1.5,
				max: 7,
			},
			{
				y: 3,
				x: 0.2 * 2.5,
				max: 8,
			},
			{
				y: 4,
				x: 0.2 * 3.5,
				max: 6,
			},

			// 顶行
			{
				y: 6,
				x: 0.2 * 0.8,
				max: 8,
			},
			{
				y: 5,
				x: 0.2 * 2,
				max: 10,
			},
			{
				y: 7,
				x: 0.2 * 3.2,
				max: 7,
			},
		].map((con, i) => {
			return {
				...con,
				cur: 0,
				in_ani: 0,
				_id: i,
			};
		}),
		full_lines: [],
	};
	progress_coins = [];

	private _load_resource_promiseout: PromiseOut<
		PIXI.loaders.ResourceDictionary
	>;
	private _is_load_resource = false;
	private _coin_assets = [
		"./assets/img/gold-coin/s36-114.png",
		"./assets/img/gold-coin/s36-152.png",
		"./assets/img/gold-coin/s36-177.png",
		"./assets/img/gold-coin/s36-208.png",
		"./assets/img/gold-coin/s36-226.png",
		"./assets/img/gold-coin/s36-79.png",
		"./assets/img/gold-coin/s36.png",
	].map((url, i) => ({
		name: "img" + i,
		url,
		info: { width: 96, height: 3456, frame_num: 36 },
	}));
}
