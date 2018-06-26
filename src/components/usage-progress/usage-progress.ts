import { Component, Input, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "usage-progress",
  templateUrl: "usage-progress.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsageProgressComponent {
  @Input("usage") usage = 0;
}
