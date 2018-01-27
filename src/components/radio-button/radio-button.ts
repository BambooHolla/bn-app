import { Component } from "@angular/core";

/**
 * Generated class for the RadioButtonComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: "radio-button",
  templateUrl: "radio-button.html",
})
export class RadioButtonComponent {
  text: string;

  constructor() {
    console.log("Hello RadioButtonComponent Component");
    this.text = "Hello World";
  }
}
