import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

import { Mdb } from "../mdb";
import { AppSettingProvider } from "../app-setting/app-setting";
import {
  AccountServiceProvider,
  AccountModel,
} from "../account-service/account-service";
import { UserInfoProvider } from "../user-info/user-info";
import { tryRegisterGlobal } from "../../bnqkl-framework/helper";
import { PromiseType } from "../../bnqkl-framework/PromiseExtends";

import pinyin from "tiny-pinyin";
tryRegisterGlobal("pinyin", pinyin);
import EventEmitter from "eventemitter3";
import * as TYPE from "./local-contact.types";
export * from "./local-contact.types";

export type TransactionModel = import("../transaction-service/transaction.types").TransactionModel;
export type TransactionWithNicknameModel = TransactionModel & {
  senderNickname?: string;
  recipientNickname?: string;
  senderName?: string;
  recipientName?: string;
};
export type BenefitModel = import("../benefit-service/benefit.types").BenefitModel;
export type BenefitWithNicknameModel = BenefitModel & {
  nickname?: string;
  name?: string;
};

export type LocalContactGroupItem = {
  letter: string;
  list: TYPE.LocalContactModel[];
};
export type LocalContactGroupList = LocalContactGroupItem[];
export enum LocalContactGroupMethod {
  /*昵称*/
  nickname,
  /*用户名*/
  username,
  /*地址*/
  address,
  /*以上所有*/
  mix,
}
export type TransactionWithLoclContactNicknameModel = PromiseType<
  ReturnType<
  typeof LocalContactProvider.prototype.formatTransactionWithLoclContactNickname
  >
  >;

@Injectable()
export class LocalContactProvider extends EventEmitter {
  contact_db = new Mdb<TYPE.LocalContactModel>("local_contact");
  tag_db = new Mdb<TYPE.TagModel>("contact_tags");
  get addressCheck() { return AppSettingProvider.IFMJSCORE.address() };

  constructor(
    public accountService: AccountServiceProvider,
    public userInfo: UserInfoProvider,
    public appSetting: AppSettingProvider
  ) {
    super();
  }
  getLocalContacts(owner_publicKey = this.userInfo.publicKey) {
    return this.contact_db.find({
      owner_publicKey,
    });
  }
  findContact(address: string, owner_publicKey = this.userInfo.publicKey) {
    return this.contact_db
      .find({
        owner_publicKey,
        address,
      })
      .then(list => list[0] as TYPE.LocalContactModel | undefined);
  }
  formatTransactionWithLoclContactNickname(
    transaction_list: TransactionModel[],
    owner_publicKey = this.userInfo.publicKey
  ) {
    const findTask = new Map<
      string,
      ReturnType<typeof LocalContactProvider.prototype.findContact>
      >();
    return Promise.all(
      transaction_list.map(async trs => {
        let sender_finder_task:
          | ReturnType<typeof LocalContactProvider.prototype.findContact>
          | undefined;
        if (trs.senderId) {
          sender_finder_task = findTask.get(trs.senderId);
          if (!sender_finder_task) {
            sender_finder_task = this.findContact(
              trs.senderId,
              owner_publicKey
            );
            findTask.set(trs.senderId, sender_finder_task);
          }
        }
        let recipient_finder_task:
          | ReturnType<typeof LocalContactProvider.prototype.findContact>
          | undefined;
        if (trs.recipientId) {
          recipient_finder_task = findTask.get(trs.recipientId);
          if (!recipient_finder_task) {
            recipient_finder_task = this.findContact(
              trs.recipientId,
              owner_publicKey
            );
            findTask.set(trs.recipientId, recipient_finder_task);
          }
        }
        const [contact_sender, contact_recipient] = await Promise.all([
          sender_finder_task,
          recipient_finder_task,
        ]);
        const res: TransactionWithNicknameModel = {
          ...trs,
          senderNickname: contact_sender && contact_sender.nickname,
          recipientNickname: contact_recipient && contact_recipient.nickname,
        };
        res.senderName = res.senderNickname || res.senderUsername;
        res.recipientName = res.recipientNickname || res.recipientUsername;
        return res;
      })
    );
  }
  formatBenefitWithLoclContactNickname(
    benefit_list: BenefitModel[],
    owner_publicKey = this.userInfo.publicKey
  ) {
    const findTask = new Map<
      string,
      ReturnType<typeof LocalContactProvider.prototype.findContact>
      >();
    return Promise.all(
      benefit_list.map(async benefit => {
        let finder_task = findTask.get(benefit.address);
        if (!finder_task) {
          finder_task = this.findContact(benefit.address, owner_publicKey);
          findTask.set(benefit.address, finder_task);
        }
        const local = await finder_task;
        const res: BenefitWithNicknameModel = {
          ...benefit,
          nickname: local && local.nickname,
        };
        res.name = res.nickname || res.username;
        return res;
      })
    );
  }
  /*搜索联系人*/
  searchContact(address_or_username: string) {
    if (this.addressCheck.isAddress(address_or_username)) {
      return this.accountService
        .getAccountByAddress(address_or_username)
        .catch(err => null);
    } else {
      return this.accountService
        .getAccountByUsername(address_or_username)
        .catch(err => null);
    }
  }
  /*搜索本地联系人*/
  async searchLocalContact(address_or_username: string) {
    // TODO
  }
  async addLocalContact(
    new_contact: { address: string; username?: string; nickname?: string },
    tags: string[] = [],
    phones: string[] = [],
    remark?: string,
    image?: Blob,
    owner_publicKey = this.userInfo.publicKey
  ) {
    const _id = owner_publicKey + "-" + new_contact.address;
    if (await this.contact_db.has({ _id })) {
      throw new Error("@@CONTACT_ALREADY_EXISTS");
    }
    await this.contact_db.insert({
      _id,
      owner_publicKey,
      address: new_contact.address,
      username: new_contact.username || "",
      nickname: new_contact.nickname,
      tags,
      phones,
      remark,
      image,
      last_update_height: this.appSetting.getHeight(),
      create_time: Date.now(),
    });
    return _id;
  }
  removeLocalContact(_id: string) {
    return this.contact_db.remove({ _id });
  }
  updateLocaContact(local_contact: TYPE.LocalContactModel) {
    const { _id, ...updates } = local_contact;
    updates.last_update_height = this.appSetting.getHeight();
    return this.contact_db.update(
      {
        _id,
      },
      updates
    );
  }
  /**
   * 将联系人进行分组
   */
  contactGroup(
    contact_list: TYPE.LocalContactModel[],
    group_method = LocalContactGroupMethod.mix
  ): LocalContactGroupList {
    const unkown_letter: LocalContactGroupItem = {
      letter: "*",
      list: [],
    };
    const letter_list_map = new Map<string, typeof unkown_letter>();

    contact_list.forEach(my_contact => {
      try {
        let pingyin_by: string | undefined;
        if (group_method === LocalContactGroupMethod.nickname) {
          pingyin_by = my_contact.nickname && my_contact.nickname[0];
        } else if (group_method === LocalContactGroupMethod.username) {
          pingyin_by = my_contact.username && my_contact.username[0];
        } else if (group_method === LocalContactGroupMethod.address) {
          pingyin_by = my_contact.address[0];
        } else if (group_method === LocalContactGroupMethod.mix) {
          pingyin_by = (my_contact.nickname ||
            my_contact.username ||
            my_contact.address)[0];
        }
        const word:
          | { source: string; type: number; target: string }
          | undefined = pinyin.parse(pingyin_by || "")[0];
        if (!word || word.type === 3) {
          unkown_letter.list.push(my_contact);
          return;
        }

        const first_letter = word[0].toUpperCase(); // 统一大写
        let letter = letter_list_map.get(first_letter);
        if (!letter) {
          letter = {
            letter: first_letter,
            list: [],
          };
          letter_list_map.set(first_letter, letter);
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
  /*标签相关的API*/
  getTags(owner_publicKey = this.userInfo.publicKey) {
    return this.tag_db.find({
      owner_publicKey,
    });
  }
  getTagByName(name: string, owner_publicKey = this.userInfo.publicKey) {
    return this.tag_db.findOne({
      name,
      owner_publicKey,
    });
  }
  async addTag(
    name: string,
    contact_ids: string[],
    owner_publicKey = this.userInfo.publicKey
  ) {
    if (await this.getTagByName(name, owner_publicKey)) {
      throw new Error("@@TAG_ALREADY_EXISTS");
    }
    const _id = owner_publicKey + "-" + name; // 使用name作为_id的一部分，如果name要进行改变，那么与其关联的联系人也都要进行变动
    await this.tag_db.insert({
      _id,
      name,
      contact_ids,
      owner_publicKey,
      create_time: Date.now(),
    });
    return _id;
  }
  removeTag(_id: string) {
    return this.tag_db.remove({ _id });
  }
  async updateTag(tag: TYPE.TagModel) {
    const { _id, ...updates } = tag;
    return this.tag_db.update({ _id }, updates);
    // // 如果这个标签里头已经没有联系人了，就自动删除标签
    // if (updates.contact_ids.length) {
    //   return this.tag_db.update(
    //     {
    //       _id,
    //     },
    //     updates
    //   );
    // } else {
    //   return this.removeTag(_id);
    // }
  }

  /*导出导入*/
  async exportLocalContacts() {
    const local_contacts = await this.getLocalContacts();
    // 绑定未确认的联系人
    const export_data =
      "ifmchain-local-contacts://" +
      JSON.stringify({
        C: local_contacts.map(c => {
          // 删除掉不必要的字段
          const { _id, ...safe_data } = c;
          return safe_data;
        }),
      });
    return { local_contacts, export_data };
  }
  async importLocalContacts(export_data: string) {
    let import_contacts: TYPE.LocalContactModel[] = [];
    const protocol_index = export_data.indexOf("://");
    if (protocol_index === -1) {
      throw new Error("@@LOCAL_CONTACTS_PARSE_ERROR");
    }
    const protocol = export_data.substr(0, protocol_index);
    if (protocol !== "ifmchain-local-contacts") {
      throw new Error("@@LOCAL_CONTACTS_PARSE_ERROR");
    }
    try {
      const parse_data = JSON.parse(export_data.substr(protocol_index + 3));
      import_contacts = parse_data.C;
    } catch (err) { }
    if (!import_contacts) {
      throw new Error("@@LOCAL_CONTACTS_PARSE_ERROR");
    }
    const success_contacts: TYPE.LocalContactModel[] = [];
    const error_contacts: TYPE.LocalContactModel[] = [];
    const skip_contacts: TYPE.LocalContactModel[] = [];
    if (import_contacts instanceof Array) {
      const has_tags = await this.getTags();
      const import_contacts_tasks = import_contacts
        .map(async icontact => {
          const contact = await this.findContact(icontact.address);
          const is_update = !!contact;
          if (contact) {
            if (contact.last_update_height >= icontact.last_update_height) {
              // 略过，
              skip_contacts.push(icontact);
              return;
            }
            icontact._id = contact._id;
          }
          if (icontact._id) {
            // 更新
            await this.updateLocaContact(icontact);
          } else {
            // 插入
            icontact._id = await this.addLocalContact(
              {
                address: icontact.address,
                username: icontact.username,
                nickname: icontact.nickname,
              },
              icontact.tags,
              icontact.phones,
              icontact.remark,
              icontact.image
            );
          }
          // 添加标签
          const add_tags_tasks = icontact.tags.map(async tag_name => {
            const find_tag = has_tags.find(t => t.name === tag_name);
            if (find_tag) {
              if (find_tag.contact_ids.indexOf(icontact._id) === -1) {
                // 更新
                find_tag.contact_ids.push(icontact._id);
                this.updateTag(find_tag);
              }
              return;
            }
            const _id = await this.addTag(tag_name, [icontact._id]);
            has_tags.push({
              _id,
              name: tag_name,
              contact_ids: [icontact._id],
              create_time: 0,
              owner_publicKey: "",
            });
          });
          await Promise.all(add_tags_tasks);
          success_contacts.push(icontact);
        })
        .map((_, i) => _.catch(err => error_contacts.push(import_contacts[i])));
      await Promise.all(import_contacts_tasks);
    }

    return {
      protocol,
      import_contacts,
      success_contacts,
      error_contacts,
      skip_contacts,
    };
  }
}
