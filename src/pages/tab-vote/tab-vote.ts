import { Component, ViewChild, ElementRef } from "@angular/core";
import { SafeStyle, DomSanitizer } from "@angular/platform-browser";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";

@IonicPage({ name: "tab-vote" })
@Component({
	selector: "page-tab-vote",
	templateUrl: "tab-vote.html",
})
export class TabVotePage extends FirstLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		public sanitizer: DomSanitizer,
	) {
		super(navCtrl, navParams);
	}
	account_info = {
		balance: 8.88888888,
	};
	@ViewChild("aniWrapper") aniWrapper: ElementRef;
	@TabVotePage.onInit
	initAniContainerSize() {
		// 初始化容器大小
		const targetEle = this.aniWrapper.nativeElement;
		targetEle.style.transform = `scale(${document.body.clientWidth *
			0.8 /
			targetEle.clientWidth})`;
	}
	private _progress_coins_config = {
		useable_lines: [
			// 底行
			{
				y: 0,
				y2d: -2,
				x: 0,
				cur: 0,
				max: 5,
			},
			{
				y: 0,
				y2d: -4,
				x: 8,
				cur: 0,
				max: 7,
			},
			{
				y: 0,
				y2d: -4,
				x: 8 * 2,
				cur: 0,
				max: 9,
			},
			{
				y: 0,
				y2d: -4,
				x: 8 * 3,
				cur: 0,
				max: 7,
			},
			{
				y: 0,
				y2d: -2,
				x: 8 * 4,
				cur: 0,
				max: 5,
			},
			// 第二行

			{
				y: -8,
				y2d: 3,
				x: 8 * 0.5,
				cur: 0,
				max: 5,
			},
			{
				y: -8,
				y2d: 5,
				x: 8 * 1.5,
				cur: 0,
				max: 7,
			},
			{
				y: -8,
				y2d: 6,
				x: 8 * 2.5,
				cur: 0,
				max: 7,
			},
			{
				y: -8,
				y2d: 3,
				x: 8 * 3.5,
				cur: 0,
				max: 5,
			},

			// 顶行
		],
		full_lines: [],
	};
	progress_coins = [];
	// @TabVotePage.didEnter
	aniProgressCoins() {
		const { useable_lines, full_lines } = this._progress_coins_config;
		const ani_ti = setInterval(() => {
			const target_line =
				useable_lines[/*(Math.random() * useable_lines.length) | */ 0];
			if (!target_line) {
				clearInterval(ani_ti);
				return;
			}
			const speed = (1 + Math.random() * 4) | 0;
			const transitionDuration = 1 - target_line.cur * 0.05;
			const base_ani_dur = 0.38 / speed;
			const res_ani_dur = transitionDuration - base_ani_dur; // 剩余的可动画的时间 s
			const res_ani_count = res_ani_dur * speed;
			const coin_style = {
				pos: {
					// transform: `translateX(${target_line.x}rem) translateY(${
					// 	target_line.y
					// }rem) translateZ(15rem)`,
					transform: `scale(0.78) translateX(${
						target_line.x
					}rem) translateY(-10rem) translateZ(0)`,
					// transitionDuration: transitionDuration + "s",
					transitionDuration: "1.38s",
					zIndex: target_line.y,
				},
				// self: {
				// 	transitionDuration: 1000 - target_line.cur * 50 + "ms",
				// 	transform: `rotateX(0deg) `,
				// },
				// count: 0.38 + (res_ani_count | 0),
				// speed: speed,
				count: 1.38,
				speed: 1,
			};
			this.progress_coins.push(coin_style);
			this.platform.raf(() => {
				// coin_style.pos.transform = coin_style.pos.transform.replace(
				// 	"translateZ(15rem)",
				// 	`translateZ(${(target_line.cur - 20) * 1.1}rem)`,
				// );
				coin_style.pos.transform = coin_style.pos.transform.replace(
					"translateY(-10rem)",
					`translateY(${(20 - target_line.cur) * 1.1 -
						target_line.y2d}rem)`,
				);
				// coin_style.self.transform = coin_style.self.transform.replace(
				// 	"rotateX(0deg)",
				// 	`rotateX(${69 + 360 * ((1 + Math.random() * 3) | 0)}deg)`,
				// );
			});
			target_line.cur += 1;
			if (target_line.cur >= target_line.max) {
				console.log("完成line", target_line);
				full_lines.push(target_line);
				useable_lines.splice(useable_lines.indexOf(target_line), 1);
			}
		}, 200);
	}

	page_status = "bootstrap";
	routeToVoteDetail() {
		this.page_status = "vote-detail";
		this.aniProgressCoins();
	}
}
