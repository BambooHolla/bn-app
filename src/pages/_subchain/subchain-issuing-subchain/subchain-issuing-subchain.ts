import { ViewChild, Component, Optional, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { sleep } from "../../../bnqkl-framework/PromiseExtends";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { fileInputEleFactory } from "../../../bnqkl-framework/helper";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams, ViewController } from "ionic-angular";
import { BlockServiceProvider, SingleBlockModel } from "../../../providers/block-service/block-service";
import { AssetsServiceProvider } from "../../../providers/assets-service/assets-service";
import { MatAutocomplete } from "@angular/material";
import { formatImage } from "../../../components/AniBase";
import { TransactionServiceProvider } from "../../../providers/transaction-service/transaction-service";

import { PwdInputPage } from "../../pwd-input/pwd-input";
import { SubchainServiceProvider } from "../../../providers/subchain-service/subchain-service";

type IssuingSubchainFormData_port = {
	web: number;
	p2p: number;
	p2pForTrs: number;
};
type IssuingSubchainFormData_rewardPerBlock = {
	height: number;
	reward: string;
}[];
type IssuingSubchainFormData_delegatesSecret = { secret: string }[];

type IssuingSubchainFormData = {
	name: string;
	abbreviation: string;

	logo: string;
	banner: string;

	forgeInterval: number;
	miniFee: number;

	genesisNodeAddress: string;
	searchPort: number;
	magic: string;
	offset: number;

	port: IssuingSubchainFormData_port;
	rewardPerBlock: IssuingSubchainFormData_rewardPerBlock;

	genesisSecret: string;
	delegatesSecret: IssuingSubchainFormData_delegatesSecret;

	/// 交易所需基本信息
	pwd: string;
	need_pay_pwd: boolean;
	pay_pwd: string;
	fee: number;

	/// 其它页面上需要的一些数据
	agree_user_aggreement: boolean;
};

@IonicPage({ name: "subchain-issuing-subchain" })
@Component({
	selector: "page-subchain-issuing-subchain",
	templateUrl: "subchain-issuing-subchain.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubchainIssuingSubchainPage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public cdRef: ChangeDetectorRef,
		public viewCtrl: ViewController,
		public blockService: BlockServiceProvider,
		public assetsService: AssetsServiceProvider,
		public transactionService: TransactionServiceProvider,
		public domSanitizer: DomSanitizer,
		public subchainService: SubchainServiceProvider
	) {
		super(navCtrl, navParams, true, tabs);
	}
	@SubchainIssuingSubchainPage.propMarkForCheck("*") formData_port: IssuingSubchainFormData_port = {} as any;
	@SubchainIssuingSubchainPage.propMarkForCheck("*") formData_rewardPerBlock: IssuingSubchainFormData_rewardPerBlock = [];
	@SubchainIssuingSubchainPage.propMarkForCheck("*") formData_delegatesSecret: IssuingSubchainFormData_delegatesSecret = [{ secret: "" }];
	@SubchainIssuingSubchainPage.propMarkForCheck("*")
	// @SubchainIssuingSubchainPage.propDetectChanges([])
	formData: IssuingSubchainFormData = (() => {
		const self = this;
		return {
			name: "",
			abbreviation: "",

			logo: "",
			banner: "",

			forgeInterval: 128,
			miniFee: "",

			genesisNodeAddress: "",
			searchPort: undefined,
			magic: "",
			offset: 1,

			get port() {
				return self.formData_port;
			},
			get rewardPerBlock() {
				return self.formData_rewardPerBlock;
			},
			genesisSecret: "",
			get delegatesSecret() {
				return self.formData_delegatesSecret;
			},

			/// 交易所需基本信息
			pwd: "",
			need_pay_pwd: this.userInfo.hasSecondPwd,
			pay_pwd: "",
			fee: parseFloat(this.appSetting.settings.default_fee),

			/// 其它页面上需要的一些数据
			agree_user_aggreement: false,
		} as any;
	})();
	ignore_keys = ["logo", "banner", "pay_pwd", "rewardPerBlock"];

	@asyncCtrlGenerator.error("@@FEE_INPUT_ERROR")
	async setFee() {
		const { custom_fee } = await this.getCustomFee(this.formData.fee);
		this.formData.fee = custom_fee;
		this.markForCheck();
	}
	///
	@SubchainIssuingSubchainPage.setErrorTo("errors", "name", ["WRONG_RANGE", "WRONG_CHAR"])
	check_name() {
		const res: any = {};
		const { name } = this.formData;
		if (name.length > 36) {
			res.WRONG_RANGE = "SUBCHAIN_NAME_TOO_LONG";
		}
		if (/\s/.test(name)) {
			res.WRONG_CHAR = "SUBCHAIN_NAME_HAS_WRONG_CHAR";
		}
		return res;
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "abbreviation", ["WRONG_RANGE", "WRONG_CHAR"])
	check_abbreviation() {
		const res: any = {};
		const { abbreviation } = this.formData;
		if (abbreviation.length > 5) {
			res.WRONG_RANGE = "SUBCHAIN_ABBREVIATION_IS_TOO_LONG";
		} else if (abbreviation.length < 2) {
			res.WRONG_RANGE = "SUBCHAIN_ABBREVIATION_IS_TOO_SHORT";
		}
		for (var i = 0; i < abbreviation.length; i += 1) {
			if (!/[a-zA-Z]/.test(abbreviation[i])) {
				res.WRONG_CHAR = "SUBCHAIN_ABBREVIATION_HAS_WRONG_CHAR";
				break;
			}
		}
		return res;
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "forgeInterval", ["WRONG_NUMBER", "WRONG_RANGE"])
	check_forgeInterval() {
		const res: any = {};
		const { forgeInterval } = this.formData;
		if (!Number.isFinite(forgeInterval)) {
			res.WRONG_NUMBER = "SUBCHAIN_FORGEINTERVAL_SHOULD_BE_AN_NUMBER";
		} else {
			if (forgeInterval <= 0) {
				res.WRONG_RANGE = "SUBCHAIN_FORGEINTERVAL_IS_TOO_SMALL";
			} else if (forgeInterval > 1e3 * 60 * 60 * 24) {
				res.WRONG_RANGE = "SUBCHAIN_FORGEINTERVAL_IS_TOO_LARGE";
			}
		}
		return res;
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "miniFee", ["WRONG_NUMBER", "WRONG_RANGE"])
	check_miniFee() {
		const res: any = {};
		const { miniFee } = this.formData;
		const miniFee_num = +miniFee;
		if (!Number.isFinite(miniFee_num)) {
			res.WRONG_NUMBER = "SUBCHAIN_MINIFEE_SHOULD_BE_AN_NUMBER";
		} else {
			if (miniFee_num < 0.00000001) {
				res.WRONG_RANGE = "SUBCHAIN_MINIFEE_IS_TOO_SMALL";
			} else if (miniFee_num > 1e3) {
				res.WRONG_RANGE = "SUBCHAIN_MINIFEE_IS_TOO_LARGE";
			}
		}
		return res;
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "genesisNodeAddress", ["WRONG_URL"])
	check_genesisNodeAddress() {
		const res: any = {};
		const { genesisNodeAddress } = this.formData;
		if (!((genesisNodeAddress.startsWith("http://") || genesisNodeAddress.startsWith("https://")) && genesisNodeAddress.includes("."))) {
			res.WRONG_URL = "GENESIS_NODE_ADDRESS_IS_MALFORMED";
		}
		return res;
	}
	/**
	 * 通用的端口检测代码
	 * @param port
	 * @param res
	 */
	private _port_checker(port: number, WRONG_PORT_RANGE_CODE: string, res: any = {}) {
		if (port <= 0 || port >= 65535) {
			res.WRONG_PORT_RANGE = WRONG_PORT_RANGE_CODE;
		}
		return res;
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "searchPort", ["WRONG_PORT_RANGE"])
	check_searchPort() {
		return this._port_checker(this.formData.searchPort, "SEARCH_PORT_IN_WRONG_RANGE");
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "port_web", ["WRONG_PORT_RANGE"], { formData_key_path: "formData.port.web" })
	check_port_web() {
		return this._port_checker(this.formData_port.web, "WEB_PORT_IN_WRONG_RANGE");
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "port_p2p", ["WRONG_PORT_RANGE"], { formData_key_path: "formData.port.p2p" })
	check_port_p2p() {
		return this._port_checker(this.formData_port.p2p, "P2P_PORT_IN_WRONG_RANGE");
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "port_p2pForTrs", ["WRONG_PORT_RANGE"], { formData_key_path: "formData.port.p2pForTrs" })
	check_port_p2pForTrs() {
		return this._port_checker(this.formData_port.p2pForTrs, "P2PFORTRS_PORT_IN_WRONG_RANGE");
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "magic", ["WRONG_RANGE"])
	check_magic() {
		const res: any = {};
		const { magic } = this.formData;
		if (magic.length > 16) {
			res.WRONG_RANGE = "MAGIC_TOO_LONG";
		}
		return res;
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "offset", ["WRONG_RANGE"])
	check_offset() {
		const res: any = {};
		const { offset } = this.formData;
		// TODO: what is offset
		return res;
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "rewardPerBlock", ["WRONG_HEIGHT", "WRONG_REWARD", "WRONG_INDEX"])
	check_rewardPerBlock() {
		const res: any = {};
		const { rewardPerBlock } = this.formData;

		let wrong_index = -1;
		if (
			rewardPerBlock.some((info, i) => {
				wrong_index = i;
				return !(isFinite(info.height) && info.height > 0);
			})
		) {
			// 检测高度是否正确
			res.WRONG_INDEX = wrong_index;
			res.WRONG_HEIGHT = "REWARDPERBLOCK_ITEM_HEIGHT_WRONG";
		} else if (
			rewardPerBlock.some((info, i) => {
				wrong_index = i;
				const reward_num = parseFloat(info.reward);
				return !(isFinite(reward_num) && reward_num >= 0);
			})
		) {
			// 检测奖励是否正确
			res.WRONG_INDEX = wrong_index;
			res.WRONG_REWARD = "REWARDPERBLOCK_ITEM_REWARD_WRONG";
		}
		return res;
	}
	private ifmchainJsCoreKeypair = this.transactionService.IFMJSCORE.keypair();
	@SubchainIssuingSubchainPage.setErrorTo("errors", "genesisSecret", ["WRONG_SECRET"])
	check_genesisSecret() {
		const res: any = {};
		const { genesisSecret } = this.formData;
		if (!this.ifmchainJsCoreKeypair.isValidSecret(genesisSecret.trim())) {
			res.WRONG_SECRET = "GENESISSECRET_IS_WRONG_SECRET";
		}
		return res;
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "delegatesSecret", ["ITEM_WRONG_SECRET", "WRONG_INDEX"])
	check_delegatesSecret() {
		const res: any = {};
		const { delegatesSecret } = this.formData;
		let wrong_index = -1;
		if (
			delegatesSecret.some((item, i) => {
				wrong_index = i;
				const delegateSecret = item.secret.trim();
				return delegateSecret.length === 0 || !this.ifmchainJsCoreKeypair.isValidSecret(delegateSecret);
			})
		) {
			res.WRONG_INDEX = wrong_index;
			res.ITEM_WRONG_SECRET = "DELEGATESSECRET_SOME_ITEM_IS_WRONG_SECRET";
		}
		return res;
	}
	/**校验支付密码*/
	@SubchainIssuingSubchainPage.setErrorTo("errors", "pay_pwd", ["VerificationFailure", "NeedInput"])
	check_pay_pwd() {
		if (this.formData.pay_pwd) {
			if (!this.transactionService.verifySecondPassphrase(this.formData.pay_pwd)) {
				return {
					VerificationFailure: "PAY_PWD_VERIFICATION_FAILURE",
				};
			}
		}
	}

	/**移除指定阶梯*/
	removeRewardBlockItem(i: number) {
		this.formData.rewardPerBlock.splice(i, 1);
	}
	/**增加新的阶梯*/
	addRewardBlockItem() {
		const { rewardPerBlock } = this.formData;
		const pre = rewardPerBlock[rewardPerBlock.length - 1] || { height: 0, reward: 0 };
		rewardPerBlock.push({
			height: pre.height + 1,
			reward: pre.reward,
		});
	}
	/**移除指定矿工密钥*/
	removeDelegatesSecretItem(i: number) {
		this.formData.delegatesSecret.splice(i, 1);
		if (this.formData.delegatesSecret.length === 0) {
			this.addDelegatesSecretItem(); // 至少需要一个矿工
		}
	}
	/**增加新的矿工密钥*/
	addDelegatesSecretItem() {
		this.formData.delegatesSecret.push({ secret: "" });
	}

	/**切换同意用户协议*/
	toggleAgreement() {
		this.formData.agree_user_aggreement = !this.formData.agree_user_aggreement;
	}

	private _pickImage(ele_id: string, to_formData_key: string, clip_type: string) {
		const inputEle = fileInputEleFactory(ele_id);
		inputEle.value = "";
		const clickEvent = new MouseEvent("click", {
			view: window,
			bubbles: true,
			cancelable: true,
		});
		inputEle.onchange = e => {
			if (inputEle.files && inputEle.files[0]) {
				const clip_dialog = this.modalCtrl.create("assets-logo-clip", {
					clip_type,
					logo_url: URL.createObjectURL(inputEle.files[0]),
					auto_return: true,
				});
				clip_dialog.present();
				clip_dialog.onWillDismiss(data => {
					if (data && data.logo_url) {
						this.formData[to_formData_key] = data.logo_url;
						inputEle.value = "";
					}
				});
			} else {
				console.log("没有选择文件，代码不应该运行到这里");
			}
		};
		inputEle.dispatchEvent(clickEvent);
	}

	pickSubchainLogo() {
		return this._pickImage("pickSubchainLogoPicker", "logo", "subchain_logo");
	}
	pickSubchainBanner() {
		return this._pickImage("pickSubchainBannerPicker", "banner", "subchain_banner");
	}

	get canSubmit() {
		const canSubmit = super.canSubmit;
		if (canSubmit) {
			if (this.formData.need_pay_pwd) {
				return !!this.formData.pay_pwd;
			}
		}
		if (!this.formData.agree_user_aggreement) {
			return false;
		}
		if (this.formData.delegatesSecret.length == 0) {
			return false;
		}
		return canSubmit;
	}
	private _cache_base64_map = new Map<string, { url: string; base64: Promise<string> }>();
	getCacheBase64(type: "logo" | "banner", url: string) {
		let cache = this._cache_base64_map.get(type);
		if (!cache || cache.url !== url) {
			cache = {
				url,
				base64: this.subchainService.imageUrlToJpegBase64(url, true),
			};
			this._cache_base64_map.set(type, cache);
		}
		return cache.base64;
	}
	/**
	 * 提交子链发行的表单
	 */
	@asyncCtrlGenerator.single()
	@asyncCtrlGenerator.error()
	@asyncCtrlGenerator.success()
	async submit() {
		const { formData } = this;
		this.subchainService.transactionService.IFMJSCORE.keypair;
		await this.subchainService.addSubchain(
			{
				name: formData.name,
				abbreviation: formData.abbreviation.toUpperCase(),
				logo: await this.getCacheBase64("logo", formData.logo),
				banner: await this.getCacheBase64("banner", formData.banner),
				forgeInterval: formData.forgeInterval,
				miniFee: (formData.miniFee * 1e8).toString(),
				genesisNodeAddress: formData.genesisNodeAddress,
				searchPort: formData.searchPort,
				magic: formData.magic,
				offset: formData.offset,
				port: formData.port,
				rewardPerBlock: formData.rewardPerBlock,
				genesisSecret: formData.genesisSecret,
				delegatesSecret: formData.delegatesSecret.map(item => item.secret),
			},
			formData.fee,
			formData.pwd,
			formData.pay_pwd
		);
		this.finishJob();
	}
}
