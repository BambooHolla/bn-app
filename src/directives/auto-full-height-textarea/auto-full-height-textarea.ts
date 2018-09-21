import { Directive, ElementRef } from "@angular/core";
import { FLP_Tool } from "../../bnqkl-framework/FLP_Tool";

@Directive({
	selector: "[auto-full-height-textarea]", // Attribute selector
})
export class AutoFullHeightTextareaDirective {
	constructor(private elementRef: ElementRef) {
		const textAreaEle = this.ele;
		textAreaEle.addEventListener("input", () => {
			this.autoReHeightPWDTextArea(textAreaEle);
		});
	}
	get ele() {
		return this.elementRef.nativeElement as HTMLTextAreaElement;
	}
	autoReHeightPWDTextArea(ele: HTMLTextAreaElement, stop_loop?: boolean) {
		if (!stop_loop) {
			FLP_Tool.raf(() => {
				this.autoReHeightPWDTextArea(ele, true);
			});
		}
		ele.style.height = "";
		if (ele.clientHeight < ele.scrollHeight) {
			ele.style.height = ele.scrollHeight + "px";
		}
	}
}
