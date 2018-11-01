import { DelayPromise } from './../../bnqkl-framework/PromiseExtends';
import { Injectable } from '@angular/core';
import { Buffer } from "buffer";
import { City } from "../../datx";

const cityFetcherDelayPromise = new DelayPromise<City>((resolve, reject) => {
  fetch("./assets/17monipdb.datx")
    .then(res => res.arrayBuffer())
    .then(data => resolve(new City(Buffer.from(data))))
    .catch(reject);
});

type countryItem = {
  ISO2: string,
  Chinese: string,
  English: string
};
type countryList = countryItem[];

const localationFetcherDelayPromise = new DelayPromise<Map<string, string>>((resolve, reject) => {
  fetch("./assets/data/countries.json")
    .then(res => res.json())
    .then((data: countryList) => {
      const map = new Map<string, string>();
      data.forEach(item => {
        map.set(item.Chinese, item.ISO2);
      });
      resolve(map);
    })
    .catch(reject);
})

@Injectable()
export class IpServiceProvider {

  async findCountry(ip: string) {
    const country = await cityFetcherDelayPromise.promise;
    const dataList = country.findSync(ip);
    if (dataList) return dataList[0];
  }

  async fetchCountries(country: string) {
    const countryMap = await localationFetcherDelayPromise.promise;
    return countryMap.get(country);
  }

}
