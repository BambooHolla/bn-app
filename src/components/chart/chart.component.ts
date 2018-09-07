import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { log } from "util";

@Component({
  selector: "svg-chart",
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./chart.component.html",
  // styleUrls: ["./chart.component.css"],
})
export class ChartComponent {
  @Input() circleLg: number = 0;
  @Input() circleMd: number = 0;
  @Input() circleSm: number = 0;
  @Input() barometer: number = 0;
  @Input() type!: string;

  getValue(value, max) {
    return this.getValueInRange(this.percent(value, max), max);
  }

  percent(value, max) {
    return max - (max * value) / 100;
  }

  getValueInRange(value: number, max: number, min = 0): number {
    return Math.max(Math.min(value, max), min);
  }
}
