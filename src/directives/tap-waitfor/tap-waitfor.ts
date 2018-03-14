import { Directive } from "@angular/core";

/**
 * Generated class for the TapWaitforDirective directive.
 *
 * See https://angular.io/api/core/Directive for more info on Angular
 * Directives.
 */
@Directive({
  selector: "[tap-waitfor]", // Attribute selector
})
export class TapWaitforDirective {
  constructor() {
    console.log("Hello TapWaitforDirective Directive");
  }
}
