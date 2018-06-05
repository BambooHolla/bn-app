import {
	Component,
	ViewChild,
	ElementRef,
	OnInit,
	AfterViewInit,
	OnDestroy,
	Input,
	Output,
	ChangeDetectionStrategy,
} from "@angular/core";
import { AniBase } from "../AniBase";
import { PromiseOut } from "../../bnqkl-framework/PromiseExtends";
import { FLP_Tool } from "../../bnqkl-framework/FLP_Tool";
import { TransactionModel } from "../../providers/transaction-service/transaction-service";
import { TimestampPipe } from "../../pipes/timestamp/timestamp";

export const loader = new PIXI.loaders.Loader();
export const _load_resource_promiseout = new PromiseOut<
	PIXI.loaders.ResourceDictionary
>();
loader.add("ticke_bg", "assets/imgs/tab-pay/offline/ticket-bg.png");
loader.add("time_clock", "assets/imgs/tab-pay/offline/time-clock.png");
loader.onError.add(err => {
	_load_resource_promiseout.reject(err);
});
loader.load((loader, resources) => {
	_load_resource_promiseout.resolve(resources);
});

const TICKET_W = 712;
const TICKET_H = 330;

@Component({
	selector: "offline-transaction-ticket",
	templateUrl: "offline-transaction-ticket.html",
})
export class OfflineTransactionTicketComponent extends AniBase {
	private _transaction?: TransactionModel;
	@Input("transaction")
	set transaction(v: TransactionModel | undefined) {
		this._transaction = v;
		this.drawTicket();
	}
	get transaction() {
		return this._transaction;
	}
	@ViewChild("canvas") canvasRef!: ElementRef;

	_init() {
		this.canvasNode || (this.canvasNode = this.canvasRef.nativeElement);
		return super._init();
	}
	constructor() {
		super();
		this.on("init-start", this.initPixiApp.bind(this));
	}
	async initPixiApp() {
		const { pt, px, canvasNode } = this;
		if (!canvasNode) {
			throw new Error("call init first");
		}
		if (!this.app) {
			// todo:use parentElement width and height
			let { clientWidth, clientHeight } = canvasNode;

			// contain模式
			if (clientWidth / clientHeight > TICKET_W / TICKET_H) {
				clientWidth = TICKET_W / TICKET_H * clientHeight;
			} else {
				clientHeight = TICKET_H / TICKET_W * clientWidth;
			}
			this.app = this.PIXIAppbuilder({
				antialias: true,
				transparent: true,
				view: canvasNode,
				height: pt(clientHeight),
				width: pt(clientWidth),
				autoStart: true,
			});
		}
		const resources = await _load_resource_promiseout.promise;
		this.drawTicket(resources);
	}
	timestampToString(timestamp: number) {
		const d = TimestampPipe.transform(timestamp);
		const monthStr = ("0" + (d.getMonth() + 1)).substr(-2);
		const dayStr = ("0" + d.getDate()).substr(-2);

		const hStr = ("0" + d.getHours()).substr(-2);
		const mStr = ("0" + d.getMinutes()).substr(-2);
		const sStr = ("0" + d.getSeconds()).substr(-2);

		//返回时间格式   yyyy/mm/dd hh:mm:ss
		return `${d.getFullYear()}-${monthStr}-${dayStr} ${hStr}:${mStr}:${sStr}`;
	}

	drawTicket(resources = loader.resources) {
		const { app, transaction } = this;
		if (!app || !transaction) {
			return;
		}
		const { renderer, stage } = app;
		const { width: W, height: H } = renderer;
		const bg = new PIXI.Sprite(resources.ticke_bg.texture);
		bg.width = W;
		bg.height = H;
		stage.addChild(bg);

		const baseSpan = W * 0.026;

		const header = new PIXI.Container();
		{
			const fontSize = W * 0.035;
			const label = new PIXI.Text(FLP_Tool.getTranslateSync("PAYER"), {
				fill: 0x2d90ab,
				fontSize,
			});

			const username = new PIXI.Text(
				this.usernameToString(
					transaction.senderUsername || transaction.senderId,
				),
				{
					fill: 0x2d90ab,
					fontSize,
				},
			);

			const timeFontSize = fontSize * 0.7;
			const clock_icon = new PIXI.Sprite(resources.time_clock.texture);
			clock_icon.width = timeFontSize;
			clock_icon.height = timeFontSize;
			const time = new PIXI.Text(
				this.timestampToString(transaction.timestamp),
				{
					fill: 0x2d90ab,
					fontSize: timeFontSize,
				},
			);
			const maxHeight = Math.max(
				...[label, username, clock_icon, time].map(item => item.height),
			);

			// 开始布局

			// left
			header.addChild(label);
			label.x = baseSpan;
			label.y = maxHeight / 2 - label.height / 2;
			header.addChild(username);
			username.x = label.x + label.width + baseSpan;
			username.y = maxHeight / 2 - username.height / 2;
			// right
			header.addChild(time);
			time.x = W - time.width - baseSpan;
			time.y = maxHeight / 2 - time.height / 2;
			header.addChild(clock_icon);
			clock_icon.x = time.x - baseSpan / 2 - clock_icon.width;
			clock_icon.y = maxHeight / 2 - clock_icon.height / 2;
			header.y = baseSpan;
		}
		stage.addChild(header);

		const center = new PIXI.Container();
		{
			const banner_fontSize = W * 0.055;
			const banner = new PIXI.Text("IFMCHAIN", {
				fontSize: banner_fontSize,
				fill: 0x2d90ab,
				dropShadow: true,
				dropShadowColor: 0xffffff,
				dropShadowAngle: 45,
				dropShadowDistance: this.devicePixelRatio,
			});
			center.addChild(banner);

			const amount_line = new PIXI.Container();
			{
				const amount_fontSize = W * 0.055;
				const amount = new PIXI.Text(
					this.amountToString(transaction.amount),
					{
						fontSize: amount_fontSize,
						fill: 0x2d90ab,
						dropShadow: true,
						dropShadowColor: 0xffffff,
						dropShadowAngle: 45,
						dropShadowDistance: this.devicePixelRatio,
					},
				);
				amount_line.addChild(amount);

				const unit_fontSize = W * 0.025;
				const unit = new PIXI.Text("IBT", {
					fontSize: unit_fontSize,
					fill: 0x2d90ab,
				});
				unit.y = amount.height - unit.height * 3 / 2;
				unit.x = amount.x + amount.width + baseSpan;
				amount_line.addChild(unit);
			}
			amount_line.y = banner.y + banner.height + H * 0.06;
			center.addChild(amount_line);

			const tran_line = new PIXI.Container();
			let tran_line_x_offset = 0;
			{
				const label_fontSize = W * 0.024;
				const label = new PIXI.Text(
					FLP_Tool.getTranslateSync("TRANSACTION_ID"),
					{
						fontSize: label_fontSize,
						fill: 0x2d90ab,
					},
				);
				label.x = baseSpan;
				tran_line_x_offset = -label.width;
				tran_line.addChild(label);

				const id_fontSize = W * 0.024;
				const formated_id = this.tidToString(transaction.id);
				const tran_id = new PIXI.Text(formated_id, {
					fontSize: id_fontSize,
					fill: 0x2d90ab,
					wordWrapWidth: W / 2,
					breakWords: true,
				});
				tran_id.x = label.x + label.width + baseSpan / 4;
				tran_line.addChild(tran_id);
			}
			tran_line.y = amount_line.y + amount_line.height + H * 0.06;
			center.addChild(tran_line);

			///
			const max_width = Math.max(
				...[banner, amount_line, tran_line].map(item => item.width),
			);
			banner.x = max_width / 2 - banner.width / 2;
			amount_line.x = max_width / 2 - amount_line.width / 2;
			tran_line.x = max_width / 2 - tran_line.width / 2;

			center.x = W / 2 - center.width / 2;
			center.y = H / 2 - center.height / 2;

			// offset
			tran_line.x += tran_line_x_offset;
		}
		stage.addChild(center);

		const remark = new PIXI.Container();
		{
			const fontSize = W * 0.03;
			const label = new PIXI.Text(
				FLP_Tool.getTranslateSync("POSTSCRIPT") + ":",
				{
					fontSize,
					fill: 0xffffff,
				},
			);
			label.x = baseSpan;
			remark.addChild(label);

			const formatedRemark = this.remarkToString(
				transaction.remark,
				fontSize,
				W - label.width - baseSpan * 4,
			);
			const text = new PIXI.Text(formatedRemark, {
				fontSize,
				fill: 0xffffff,
			});
			text.x = label.x + label.width + baseSpan;
			remark.addChild(text);

			///
			remark.y = H - baseSpan - remark.height;
		}
		stage.addChild(remark);

		// 渲染
		this.forceRenderOneFrame();
	}
	usernameToString(username: string) {
		if (username.length > 8) {
			username = username.substr(0, 4) + "***" + username.substr(-4);
		}
		return username;
	}
	amountToString(amount: string) {
		const amount_value = parseFloat(amount) / 1e8;
		const amount_info = amount_value.toFixed(8).split(".");
		const int_str = amount_info[0] || "";
		const float_str = amount_info[1] || "";

		const tmp =
			int_str
				.split("")
				.reverse()
				.join("")
				.match(/\d{1,3}/g) || [];

		const formated_int_str = tmp
			.join(",")
			.split("")
			.reverse()
			.join("");
		return formated_int_str + "." + float_str;
	}
	tidToString(id: string) {
		const center_index = (id.length / 2) | 0;
		return id.substr(0, center_index) + "\n" + id.substr(center_index);
	}
	remarkToString(
		remark: string | undefined,
		fontSize: number,
		maxWidth: number,
	) {
		if (!remark) {
			return "";
		}
		let res = remark.substr(0, 20);
		const res_text = new PIXI.Text(res, { fontSize });

		while (res_text.width < maxWidth && res.length < remark.length) {
			res += remark[res.length];
			res_text.text = res;
		}
		if (res.length < remark.length) {
			res += "...";
		}
		return res;
	}
}