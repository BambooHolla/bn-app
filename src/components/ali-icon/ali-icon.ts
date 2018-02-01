import { Component, Input } from "@angular/core";

@Component({
  selector: "ali-icon",
  templateUrl: "ali-icon.html",
})
export class AliIconComponent {
  @Input() name?: string;
}
