import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

import { Mdb } from "../mdb";
import { AppSettingProvider } from "../app-setting/app-setting";
import {
	AccountServiceProvider,
	AccountModel,
} from "../account-service/account-service";
import { UserInfoProvider } from "../user-info/user-info";
import { AppSettingProvider } from "../app-setting/app-setting";
import { tryRegisterGlobal } from "../../bnqkl-framework/helper";

import pinyin from "tiny-pinyin";
tryRegisterGlobal("pinyin", pinyin);
import EventEmitter from "eventemitter3";
import * as TYPE from "./local-contact.types";
export * from "./local-contact.types";

export type LocalContactGroupItem = {
	letter: string;
	list: TYPE.LocalContactModel[];
};
export type LocalContactGroupList = LocalContactGroupItem[];
export enum LocalContactGroupMethod {
	/*用户名*/
	username,
	/*地址*/
	address,
	/*以上两者*/
	mix,
}

@Injectable()
export class LocalContactProvider extends EventEmitter {
	contact_db = new Mdb<TYPE.LocalContactModel>("local_contact");
	tag_db = new Mdb<TYPE.TagModel>("contact_tags");
	addressCheck;
	ifmJs;

	constructor(
		public accountService: AccountServiceProvider,
		public userInfo: UserInfoProvider,
		public appSetting: AppSettingProvider,
	) {
		super();
		this.ifmJs = AppSettingProvider.IFMJS;
		this.addressCheck = this.ifmJs.addressCheck;
	}
	getLocalContacts(owner_publicKey = this.userInfo.publicKey) {
		return this.contact_db.find({
			owner_publicKey,
		});
	}
	findMyContact(address: string, owner_publicKey = this.userInfo.publicKey) {
		return this.contact_db
			.find({
				owner_publicKey,
				address,
			})
			.then(list => list[0]);
	}
	/*搜索联系人*/
	async searchContact(address_or_username: string) {
		let contact: AccountModel;
		if (!this.addressCheck.isAddress(address_or_username)) {
			return await this.accountService
				.getAccountByUsername(address_or_username)
				.catch(err => null);
		} else {
			return this.accountService
				.getAccountByAddress(address_or_username)
				.catch(err => null);
		}
	}
	/*搜索本地联系人*/
	async searchLocalContact(address_or_username: string) {
		// TODO
	}
	async addLocalContact(
		new_contact: { address: string; username?: string },
		tags: string[] = [],
		phones: string[] = [],
		remark?: string,
		image?: Blob,
		owner_publicKey = this.userInfo.publicKey,
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
			updates,
		);
	}
	/**
	 * 将联系人进行分组
	 */
	contactGroup(
		contact_list: TYPE.LocalContactModel[],
		group_method = LocalContactGroupMethod.mix,
	): LocalContactGroupList {
		const unkown_letter: LocalContactGroupItem = {
			letter: "*",
			list: [],
		};
		const letter_list_map = new Map<string, typeof unkown_letter>();

		contact_list.forEach(my_contact => {
			try {
				let pingyin_by: string | undefined;
				if (group_method === LocalContactGroupMethod.username) {
					pingyin_by = my_contact.username && my_contact.username[0];
				} else if (group_method === LocalContactGroupMethod.address) {
					pingyin_by = my_contact.address[0];
				} else if (group_method === LocalContactGroupMethod.mix) {
					pingyin_by = (my_contact.username || my_contact.address)[0];
				}
				const word: string | undefined =
					pingyin_by && pinyin.convertToPinyin(pingyin_by);
				if (!word) {
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
		owner_publicKey = this.userInfo.publicKey,
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
		// 如果这个标签里头已经没有联系人了，就自动删除标签
		if (updates.contact_ids.length) {
			return this.tag_db.update(
				{
					_id,
				},
				updates,
			);
		} else {
			return this.removeTag(_id);
		}
	}
}
