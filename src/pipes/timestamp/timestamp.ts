import { Pipe, PipeTransform } from '@angular/core';
import { AppSettingProvider } from '../../providers/app-setting/app-setting';

@Pipe({
  name: 'timestamp',
})
export class TimestampPipe implements PipeTransform {
  /**
   * 输入timestamp
   */
  transform(value: number, ...args) {
    //种子的UTC时间
    let d = new Date(Date.UTC(AppSettingProvider.SEED_DATE[0], AppSettingProvider.SEED_DATE[1], AppSettingProvider.SEED_DATE[2], AppSettingProvider.SEED_DATE[3], AppSettingProvider.SEED_DATE[4], AppSettingProvider.SEED_DATE[5], AppSettingProvider.SEED_DATE[6]));
    //获取传入时间戳
    let t = parseInt((d.getTime() / 1000).toString());
    
    //获得传入时间戳的准确时间戳
    let tDate = new Date((value + t) * 1000);
    return tDate;
    // let month = d.getMonth() + 1;
    // let monthStr: string;
    // //获得年月日
    // if (month < 10) {
    //     monthStr = "0" + month;
    // }

    // let day = d.getDate();
    // let dayStr: string;

    // if (day < 10) {
    //     dayStr = "0" + day;
    // }

    // let h = d.getHours();
    // let hStr:string;
    // let m = d.getMinutes();
    // let mStr:string;
    // let s = d.getSeconds();
    // let sStr:string;

    // if (h < 10) {
    //     hStr = "0" + h;
    // }

    // if (m < 10) {
    //     mStr = "0" + m;
    // }

    // if (s < 10) {
    //     sStr = "0" + s;
    // }
    // //返回时间格式   yyyy/mm/dd hh:mm:ss
    // return d.getFullYear() + "/" + monthStr + "/" + dayStr + " " + hStr + ":" + mStr + ":" + sStr;
  }
}
