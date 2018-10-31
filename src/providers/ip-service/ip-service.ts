import { DelayPromise } from './../../bnqkl-framework/PromiseExtends';
import { FLP_Tool } from './../../bnqkl-framework/FLP_Tool';
import { Injectable } from '@angular/core';
import { Buffer } from "buffer";
import { City, translateCity } from "../../datx";

const city_fetcher_delaypromise = new DelayPromise<City>((resolve, reject) => {
  fetch("./assets/17monipdb.datx")
    .then(res => res.arrayBuffer())
    .then(data => resolve(new City(Buffer.from(data))))
    .catch(reject);
});
const localation_fetcher_delaypromise = new DelayPromise<any>((resolve, reject) => {
  fetch("./assets/country_xy.json")
    .then(res => resolve(res.json()))
    .catch(reject);
})

@Injectable()
export class IpServiceProvider {
  async findCity(ip: string) {
    const city = await city_fetcher_delaypromise;
    return city.findSync(ip)
  }
  async findCityAndTranslate(ip: string) {
    const city_info = await this.findCity(ip);
    if (city_info) {
      return await translateCity(city_info[0], k => FLP_Tool.getTranslateSync(k))
    }
  }
  async findCityLocalaction(ip) {
    const city_info = await this.findCity(ip);
    if (city_info) {
      const contury = city_info[0];
      // const localation = await localation_fetcher_delaypromise;
      return {
        x: 1,
        y: 2
      }
    }
  }
}
