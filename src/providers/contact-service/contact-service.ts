import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AppFetchProvider, CommonResponseData } from "../app-fetch/app-fetch";
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { Observable, BehaviorSubject } from "rxjs";
// import { PromisePro } from "../../bnqkl-framework/RxExtends";
import { AsyncBehaviorSubject } from "../../bnqkl-framework/RxExtends";
import {
  AppSettingProvider,
  TB_AB_Generator,
  HEIGHT_AB_Generator,
} from "../app-setting/app-setting";
import { AccountServiceProvider } from "../account-service/account-service";
import {
  TransactionServiceProvider,
  TransactionTypes,
} from "../transaction-service/transaction-service";
import { UserInfoProvider } from "../user-info/user-info";
import { DbCacheProvider } from "../db-cache/db-cache";
import * as IFM from "ifmchain-ibt";
import * as TYPE from "./contact.types";
export * from "./contact.types";
import pinyin from "tiny-pinyin";
import { Mdb } from "../mdb";

export type ContactGroupItem = { letter: string; list: TYPE.ContactModel[] };
export type ContactGroupList = ContactGroupItem[];

@Injectable()
export class ContactServiceProvider {
  ifmJs: any;
  contact: any;
  TransactionTypes = TransactionTypes;
  addressCheck: any;
  followingList?: any[] = [];
  followerList?: any[] = [];
  contactDb = new Mdb<TYPE.ContactProModel>("contact");
  constructor(
    public http: HttpClient,
    public appSetting: AppSettingProvider,
    // public storage: Storage,
    public translateService: TranslateService,
    public fetch: AppFetchProvider,
    public accountService: AccountServiceProvider,
    public transactionService: TransactionServiceProvider,
    public user: UserInfoProvider,
    public dbCache: DbCacheProvider,
  ) {
    this.ifmJs = AppSettingProvider.IFMJS;
    this.addressCheck = this.ifmJs.addressCheck;
    this.dbCache.installApiCache<
      TYPE.ContactProModel,
      TYPE.MyContactResModel<TYPE.ContactProModel>
    >(
      "contact",
      "get",
      this.GET_CONTACT,
      async (db, request_opts) => {
        const cache: TYPE.MyContactResModel<TYPE.ContactProModel> = {
          followers: [],
          following: [],
          success: true,
        };
        if (navigator.onLine) {
          // 默认联网获取
          return { reqs: [request_opts], cache };
        }
        const search = request_opts.reqOptions.search as any;
        if (!(search && search.publicKey)) {
          throw new Error("Parameter verification failed.");
        }
        cache.followers = await this.contactDb.find({
          owner_publicKey: search.publicKey,
        });
        return { reqs: [], cache };
      },
      async req_res_list => {
        if (req_res_list.length > 0) {
          return req_res_list[0].result;
        }
      },
      async (db, mix_res, cache, request_opts) => {
        if (mix_res && mix_res.success) {
          const res_following = mix_res.following;
          if (res_following instanceof Array) {
            const owner_publicKey: string = (request_opts.reqOptions
              .search as any).publicKey;
            await this.dbCache.commonDbSync(
              res_following,
              undefined,
              db,
              { owner_publicKey },
              "address",
            );
          }
          // const res_followers = mix_res.followers;
          // if (res_followers instanceof Array) {
          //   res_followers.forEach()
          //   const owner_publicKey: string = (request_opts.reqOptions
          //     .search as any).publicKey;
          //   await this.dbCache.commonDbSync(
          //     res_followers,
          //     undefined,
          //     db,
          //     { owner_publicKey },
          //     "address",
          //   );
          // }
          return mix_res;
        }
        return cache;
      },
    );
  }
  contactModelDiffParser(contact: TYPE.ContactModel) {
    return contact.username + contact.address;
  }

  readonly GET_CONTACT = this.appSetting.APP_URL("/api/contacts/");

  /**
   * 获取我的联系人，默认返回所有
   * @param opt
   * opt - 0 || !opt : 获取已添加和未添加
   * opt - 1 : 获取已添加
   * opt - 2 : 获取未添加
   */
  async getMyContacts(opt?: number) {
    const data = await this.fetch.get<
      TYPE.MyContactResModel<TYPE.ContactProModel>
    >(this.GET_CONTACT, {
      search: {
        publicKey: this.user.userInfo.publicKey,
      },
    });

    data.followers = await this.contactIgnored(data.followers);
    this.followingList = data.following;
    this.followerList = data.followers;
    switch (opt) {
      case 0:
        return { following: data.following, follower: data.followers };
      default:
        return { following: data.following, follower: data.followers };
    }
  }
  myContact!: AsyncBehaviorSubject<{
    follower: TYPE.ContactModel[];
    following: TYPE.ContactModel[];
  }>;
  @HEIGHT_AB_Generator("myContact", true)
  myContact_Executor(promise_pro) {
    return promise_pro.follow(this.getMyContacts());
  }

  /**
   * 忽略联系人操作
   * TODO： 使用mdb，而不是storage
   * @param 忽略的地址
   */
  async ignoreContact(iAddress) {
    let address = this.user.address;
    let ignoreList: any[] = [];

    // let ignoreBefore = JSON.parse(await this.storage.get("c_" + address));
    // if (ignoreBefore) {
    //   ignoreList = ignoreBefore;
    //   ignoreList.push(iAddress);
    // } else {
    //   ignoreList.push(iAddress);
    // }

    for (var i of ignoreList) {
      if (this.followerList && this.followerList.length > 0) {
        let isIgnore = this.followerList.indexOf(ignoreList[i]);
        if (isIgnore >= 0) {
          this.followerList.splice(i, 1);
        }
      } else {
        this.followerList = [];
        break;
      }
    }
    // await this.storage.set("c_" + address, JSON.stringify(ignoreList));
    return this.followerList;
  }

  /**
   * 忽略用户
   * @param followerList
   */
  async contactIgnored(followerList) {
    return followerList;
    // if (!followerList || followerList.length === 0) {
    //   return followerList || [];
    // }
    // let address = this.user.address;
    // let ignoreList = JSON.parse(await this.storage.get("c_" + address));

    // //如果包含忽略的且有未添加的人员
    // if (ignoreList && ignoreList.length > 0 && followerList.length > 0) {
    //   for (var i = followerList.length - 1; i >= 0; i--) {
    //     if (ignoreList.findIndex(followerList[i]) >= 0) {
    //       followerList.splice(i, 1);
    //     }
    //   }
    //   return followerList;
    // } else {
    //   return followerList;
    // }
  }

  /**
   * 获取已被忽略的列表
   */
  async getIgnoreList() {
    return [];
    // let ignoreList = JSON.parse(
    //   await this.storage.get("c_" + this.user.address),
    // );

    // return ignoreList;
  }

  /**
   * 添加联系人，密码、二次密码，地址（可选），用户名（可选），地址和用户名必选一种
   * @param secret
   * @param secondSecret
   * @param address
   * @param username
   */
  async addContact(
    secret: string,
    address_or_username: string,
    secondSecret?: string,
    fee = parseFloat(this.appSetting.settings.default_fee),
    type: "+" | "-" = "+",
  ) {
    if (!address_or_username) {
      throw new Error("Parameters cannot find address or username");
    }

    if (!this.addressCheck.isAddress(address_or_username)) {
      let userAddress = await this.accountService.getAccountByUsername(
        address_or_username,
      );
      address_or_username = userAddress.address;
    }

    let txData: any = {
      type: TransactionTypes.FOLLOW,
      amount: "0",
      secret: secret,
      asset: {
        contact: {
          address: type + address_or_username,
        },
      },
      fee: fee.toString(),
      publicKey: this.user.userInfo.publicKey,
    };

    if (secondSecret) {
      txData.secondSecret = secondSecret;
    }

    try {
      await this.transactionService.putTransaction(txData);
      return true;
    } catch (err) {
      console.error(err);
      throw new Error("Add contact transaction error");
    }
  }

  /**
   * 根据地址或用户名获得用户信息，地址或用户名取其一
   * @param address
   * @param username
   */
  async searchContact(address?: string, username?: string) {
    if (address) {
      return await this.accountService.getAccountByAddress(address);
    } else if (username) {
      return await this.accountService.getAccountByUsername(username);
    } else {
      return null;
    }
  }
  /**
   * 将联系人进行分组
   */
  contactGroup(contact_list: TYPE.ContactModel[]): ContactGroupList {
    const unkown_letter: ContactGroupItem = {
      letter: "*",
      list: [],
    };
    const letter_list_map = new Map<string, typeof unkown_letter>();

    contact_list.forEach(my_contact => {
      try {
        const word = pinyin.convertToPinyin(
          (my_contact.username || my_contact.address)[0],
        );
        if (!word) {
          unkown_letter.list.push(my_contact);
          return;
        }
        let letter = letter_list_map.get(word[0]);
        if (!letter) {
          letter = {
            letter: word[0],
            list: [],
          };
          letter_list_map.set(word[0], letter);
        }
        letter.list.push(my_contact);
      } catch {
        unkown_letter.list.push(my_contact);
      }
    });
    if (unkown_letter.list.length) {
      letter_list_map.set(unkown_letter.letter, unkown_letter);
    }
    return [...letter_list_map.values()].sort((a, b) => {
      return a.letter.localeCompare(b.letter);
    });
  }
  setRemark(contact: TYPE.ContactModel, remark_info: TYPE.ContactProModel) {}
}
