import { Pipe, PipeTransform } from "@angular/core";
import { AppSettingProvider } from "../../providers/app-setting/app-setting";

@Pipe({
    name: "timestamp",
})
export class TimestampPipe implements PipeTransform {
    /**
     * 输入timestamp
     */
    transform = TimestampPipe.transform;
    static transform(value: number, type?) {
        var data_stamp = value + AppSettingProvider.seedDateTimestamp;
        if (type === "timezone") {
            data_stamp += AppSettingProvider.timezoneoffset;
        }
        //获得传入时间戳的准确时间戳
        return new Date(data_stamp * 1000);
    }
}
