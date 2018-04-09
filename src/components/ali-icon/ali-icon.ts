import { Component, Input,ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "ali-icon",
  templateUrl: "ali-icon.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AliIconComponent {
  @Input() name?: string;
}
