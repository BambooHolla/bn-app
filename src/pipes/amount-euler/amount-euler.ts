import { Pipe, PipeTransform } from "@angular/core";

/**
 * Generated class for the AmountEulerPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: "amountEuler",
})
export class AmountEulerPipe implements PipeTransform {
  /**
   * Takes a value and makes it lowercase.
   */
  transform(num: number, ...args) {
    num = num / 100000000 || 0;
    let numStr = "" + num;
    if (/e/.test(numStr) == true) {
      numStr = num.toFixed(8);
      return numStr;
    }
    return numStr;
  }
}
