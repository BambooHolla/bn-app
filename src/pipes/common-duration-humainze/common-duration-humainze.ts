import { Pipe, PipeTransform } from "@angular/core";
import * as moment from "moment";
import { FLP_Tool } from "../../bnqkl-framework/FLP_Tool";
import { TranslateService } from "@ngx-translate/core";

@Pipe({
  name: "commonDurationHumainze",
})
export class CommonDurationHumainzePipe implements PipeTransform {
  @FLP_Tool.FromGlobal translate!: TranslateService;
  get localName() {
    return FLP_Tool.formatLocalName(this.translate.currentLang);
  }
  /**
   * 一小时以内，显示人性化的，一小时以后，显示具体时间
   */
  transform(date, lang = this.localName, format = "YYYY.MM.DD hh:mm") {
    const now = Date.now();
    const date_num = +date;
    const diff = now - date_num;
    if (diff > 3600000 /* 1h */) {
      const m = moment(date_num).locale(lang);
      return m.format(format);
    } else {
      const m = moment.duration(diff / 1000, "seconds").locale(lang);
      return m.humanize(true);
    }
  }
}
