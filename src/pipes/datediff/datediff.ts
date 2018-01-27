import { Pipe, PipeTransform } from "@angular/core";

/**
 * Generated class for the DatediffPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: "datediff",
})
export class DatediffPipe implements PipeTransform {
  /**
   * Takes a value and makes it lowercase.
   */
  transform(dateTime: any, ...args) {
    dateTime = isNaN(dateTime) ? new Date(dateTime) : dateTime;

    let nowTime = new Date().getTime(),
      diffValue = nowTime - dateTime,
      result = "",
      m = 1000 * 60,
      h = m * 60,
      d = h * 24,
      month = d * 30,
      y = month * 12,
      _y = diffValue / y,
      _month = diffValue / month,
      _week = diffValue / (d * 7),
      _d = diffValue / d,
      _h = diffValue / h,
      _m = diffValue / m;

    if (_y > 1) {
      result = Math.floor(_y) + " years ago";
    } else if (_y == 1) {
      result = "a year ago";
    } else if (_month > 1) {
      result = Math.floor(_month) + " months ago";
    } else if (_month == 1) {
      result = "a month ago";
    } else if (_d > 1) {
      result = Math.floor(_d) + " days ago";
    } else if (_d == 1) {
      result = "one day ago";
    } else if (_h > 1) {
      result = Math.floor(_h) + " hours ago";
    } else if (_h == 1) {
      result = "one hour ago";
    } else if (_m > 1) {
      result = Math.floor(_m) + " minutes ago";
    } else if (_m == 1) {
      result = "a minute ago";
    } else if (diffValue > 1) {
      result = diffValue + " seconds ago";
    } else {
      result = "just now";
    }

    return result;
  }
}
