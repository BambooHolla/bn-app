import {
  Directive,
  Output,
  Input,
  ElementRef,
  EventEmitter,
} from "@angular/core";
import { Clipboard } from "@ionic-native/clipboard";
import { FLP_Tool } from "../../bnqkl-framework/FLP_Tool";
import { formatAndTranslateMessage } from "../../bnqkl-framework/Decorator";
import { ToastController } from "ionic-angular/index";
import { TranslateService } from "@ngx-translate/core";

@Directive({
  selector: "[before-submit]", // Attribute selector
})
export class BeforeSubmitDirective {
  @FLP_Tool.FromGlobal toastCtrl!: ToastController;
  @FLP_Tool.FromGlobal translate!: TranslateService;

  @Input("before-submit") before_submit!: Function;
  @Output("do-submit")
  can_submit_fun = new EventEmitter<TouchEvent | MouseEvent>();
  @Output("un-submit")
  not_submit_fun = new EventEmitter<TouchEvent | MouseEvent>();
  // new EventEmitter<boolean | undefined | {
  //  [error_msg: string]: any
  // }>();
  constructor(public eleRef: ElementRef) {
    this.eleRef.nativeElement.addEventListener("click", async e => {
      let has_error;
      try {
        has_error = await this.before_submit(e);
      } catch (err) {
        has_error = err;
      }
      if (!has_error) {
        this.can_submit_fun.emit(e);
      } else {
        if (this.not_submit_fun.observers.length) {
          //有监听函数的话，由监听函数处理
          this.not_submit_fun.emit(has_error);
        } else {
          // 否则使用统一的处理规则来处理错误
          this.commonErrorHandle(has_error);
        }
      }
    });
  }
  async commonErrorHandle(has_error) {
    const message = await formatAndTranslateMessage(has_error);
    this.toastCtrl
      .create({
        message,
        duration: 2000,
      })
      .present();
  }
}
