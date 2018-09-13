import { Pipe, PipeTransform } from "@angular/core";
import * as moment from "moment";

@Pipe({
  name: "commonDurationHumainze",
})
export class CommonDurationHumainzePipe implements PipeTransform {
  /**
   * 一小时以内，显示人性化的，一小时以后，显示具体时间
   */
  transform(date, lang, format = "YYYY.MM.DD hh:mm") {
    const now = Date.now();
    const date_num = +date;
    const diff = now - date_num;
    if (diff > 3600000 /* 1h */) {
      return moment(date_num)
        .locale(lang)
        .format(format);
    } else {
      return moment
        .duration(diff / 1000, "seconds")
        .locale(lang)
        .humanize(lang);
    }
  }
}
