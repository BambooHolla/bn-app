import { Directive, Input, ElementRef } from '@angular/core';
import { Clipboard } from "@ionic-native/clipboard";
import { FLP_Tool } from '../../bnqkl-framework/FLP_Tool'
import { ToastController } from "ionic-angular";

@Directive({
	selector: '[click-to-copy]' // Attribute selector
})
export class ClickToCopyDirective {
	@FLP_Tool.FromGlobal toastCtrl!: ToastController;
	@FLP_Tool.FromGlobal _clipboard!: Clipboard;
	clipboard: {
		writeText: (text: string) => Promise<void>,
		readText: () => Promise<string>,
	} = navigator["clipboard"] || {
		writeText: text => this._clipboard.copy(text),
		readText: () => this._clipboard.paste(),
	};
	@Input("click-to-copy") text = "";
	// 这里不用做翻译，外部传入就好
	@Input("copy-success-toast") success_msg = "复制成功";
	@Input("copy-error-toast") error_msg = "复制失败";
	constructor(public eleRef: ElementRef) {
		this.eleRef.nativeElement.addEventListener("click", e => {
			this.clipboard.writeText(this.text).then(() => {
				this.toastCtrl.create({ message: this.success_msg }).present()
			}).catch((err) => {
				console.error(err)
				this.toastCtrl.create({ message: this.error_msg }).present()
			});
		});
	}

}