import { tryRegisterGlobal } from "../../bnqkl-framework/FLP_Tool";
import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";

@Component({
  selector: "mac-ark-1",
  templateUrl: "mac-ark-1.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MacArk_1Component {
  static __uid = 0;
  private _base_progress = 0.15;
  private _end_progress = 0.32;
  show_progress = 0;

  @Input("progress")
  set progress(v: number) {
    v = Math.min(Math.max(0, parseFloat(v as any) || 0), 1);
    const { _base_progress, _end_progress } = this;
    this.show_progress =
      (1 - _base_progress - _end_progress) * v + this._base_progress;
    this._progress = v;
  }
  _progress = 0;
  get progress() {
    return this._progress;
  }
  constructor() {
    tryRegisterGlobal("mac_ark_1_" + MacArk_1Component.__uid++, this);
  }
}
