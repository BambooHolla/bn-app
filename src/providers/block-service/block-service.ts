import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppFetchProvider, CommonResponseData } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject } from "rxjs";
// import { PromisePro } from "../../bnqkl-framework/RxExtends";
import { AsyncBehaviorSubject } from "../../bnqkl-framework/RxExtends";
import { AppSettingProvider, TB_AB_Generator} from "../app-setting/app-setting";
import * as IFM from 'ifmchain-ibt';

/*
  Generated class for the BlockServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class BlockServiceProvider {
  ifmJs: any;
  block: any;
  blockArray: any;

  constructor(
    public http: HttpClient,
    public appSetting: AppSettingProvider,
    public fetch: AppFetchProvider,
    public storage: Storage,
    public translateService: TranslateService
  ) {
    console.log('Hello BlockServiceProvider Provider');
    this.ifmJs = AppSettingProvider.IFMJS;
    this.block = this.ifmJs.Api(AppSettingProvider.HTTP_PROVIDER).block;
    console.log(this.block);
    console.groupEnd();
  }
  readonly GET_LAST_BLOCK_URL = this.appSetting.APP_URL("/api/blocks/getLastBlock");
  readonly GET_BLOCK_BY_ID = this.appSetting.APP_URL("/api/blocks/get");


  /**
   * 获取当前区块链的块高度
   * @returns {Promise<any>}
   */
  async getLastBlock() {
    let data = this.block.getLastBlock();
    //data: {success, block:{id, height, timestamp}}
    return data.block;
  }

  /**
   * 根据块ID获取块信息，返回一个对象
   * @param {string} blockId
   * @returns {Promise<any>}
   */
  async getBlockById(blockId : string) {
    let data = await this.block.getBlockById(blockId);

    if(data.success === true && data.count > 0) {
      return data.blocks;
    }else {
      return [];
    }
  }

  /**
   * 返回根据高度搜索到的块，返回一个对象
   * @param {number} height
   * @returns {Promise<any>}
   */
  async getBlockByHeight(height : number) {
    let data = await this.getBlocks({height: height});

    if(data.success === true && data.count > 0) {
      return data.blocks;
    }else {
      return [];
    }
  }

  /**
   * 返回根据地址搜索的块，返回一个数组
   * @param {string} address
   * @returns {Promise<any>}
   */
  async getBlocksByAddress(address: string) {
    let data = await this.getBlocks({generatorId: address});

    if(data.success === true && data.count > 0) {
      return data.blocks;
    }else {
      return [];
    }
  }

  /**
   * 搜索块，可以搜索高度、地址和ID任一
   * @param {string} query
   * @returns {Promise<any>}
   */
  async searchBlocks(query : string) {
    //如果是纯数字且不是以0开头就查高度
    if(query.test(/[1-9][0-9]+/)) {
      query = query * 1;
      let data = await this.getBlockByHeight(query);
      return data;
    }else {
      //首先查创块人
      let data1 = await this.getBlocksByAddress(query);
      if(data1.length > 0) {
        return data1;
      }

      //不是创块人则搜索ID
      let data2 = await this.getBlockById(query);
      if(data2.length > 0) {
        return data2;
      }

      return [];
    }
  }

  /**
   * 获取区块信息
   * @param {{}} query  查询的条件，对象存在
   * @returns {Promise<{}>}
   */
  async getBlocks(query = {}) {
    let data = {};
    if(typeof(query) === 'object' || typeof(query) === undefined) {
      data = await this.block.getBlocks(query);
    }

    return data;
  }

  /**
   * 增量更新块信息
   * @param {number} amount  更新数量，空时默认10个
   * @param {boolean} increment  是否增量更新
   * @returns {Promise<void>}
   */
  async getTopBlocks(increment : boolean, amount = 10) {
    //增量查询
    if(increment) {
      let currentBlock = await this.getLastBlock();
      let currentHeight = currentBlock.block.height;

      //有缓存时
      if(this.blockArray && this.blockArray.length > 0 && this.blockArray.length >= amount) {

        //如果缓存高度和当前高度一致返回缓存
        if(currentHeight === this.blockArray[0].height) {
          return {"blocks" : this.blockArray.slice(0, amount-1)};
        }else {

          //如果缓存高度不一致
          var heightBetween = currentHeight - this.blockArray[0].height;
          //缓存高度和当前高度相差太大则重新获取，否则只获取相差的块
          if(heightBetween > amount) {
            return await this.getTopBlocks(false, amount);
          }else {

            //增量的加入缓存
            let data = await this.getBlocks({
              "limit" : heightBetween,
              "orderBy" : "height:desc"
            });
            //把数组插入原数组前面
            //Array.prototype.splice然后把指针指向
            if(data.success) {
              data.blocks.unshift(data.blocks.length, 0);
              Array.prototype.splice.apply(this.blockArray, data.blocks);
              return this.blockArray.slice(0, amount-1);
            }else {
              return this.blockArray.slice(0, amount-1);
            }
          }
        }
      }else {
        this.getTopBlocks(false, amount);
      }
    }else {
      let data = await this.getBlocks({
        "limit" : amount,
        "orderBy" : "height:desc"
      });
      this.blockArray = data.blocks;
      return data;
    }
  }

  /**
   * 分页查询数据，页数从1开始
   * @param {number} page 从1开始
   * @param {number} limit
   * @returns {Promise<any>}
   */
  async getBlocksByPage(page : number, limit = 10) {
    if(page === 0 && this.blockArray && this.blockArray.length > limit) {
      await this.getTopBlocks(true, limit);
    }else {
      let data = await this.getBlocks({
        "offset" : (page-1) * limit,
        "limit" : limit
      })
      if(data.success && data.blocks.length > 0) {
        return data.blocks;
      }

      return [];
    }
  }
}

