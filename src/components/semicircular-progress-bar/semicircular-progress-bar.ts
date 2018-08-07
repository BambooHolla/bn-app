import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";

@Component({
  selector: "semicircular-progress-bar",
  templateUrl: "semicircular-progress-bar.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SemicircularProgressBarComponent {
  @Input("progress") progress = 0;
  toFixed(val: number, min = 0, max?: number) {
    if (typeof max === "undefined") {
      max = min;
    }
    var res = val.toFixed(max);
    var diff = max - min;
    while (diff > 0) {
      if (res[res.length - 1] === "0") {
        res = res.substr(0, res.length - 1);
      } else {
        break;
      }
    }
    return res;
  }
}
