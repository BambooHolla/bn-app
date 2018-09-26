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
}
type IssuingSubchainFormData_rewardPerBlock = {
	height: number;
	reward: string;
}[];
type IssuingSubchainFormData_delegatesSecret = string[]

type IssuingSubchainFormData = {
	name: string;
	abbreviation: string;

	logo: string;
	banner: string;

	forgeInterval: number;
	miniFee: string;

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
	@SubchainIssuingSubchainPage.propMarkForCheck("*")
	formData_port: IssuingSubchainFormData_port = {} as any;
	@SubchainIssuingSubchainPage.propMarkForCheck("*")
	formData_rewardPerBlock: IssuingSubchainFormData_rewardPerBlock = []
	@SubchainIssuingSubchainPage.propMarkForCheck("*")
	formData_delegatesSecret: IssuingSubchainFormData_delegatesSecret = []
	@SubchainIssuingSubchainPage.propMarkForCheck("*")
	// @SubchainIssuingSubchainPage.propDetectChanges([])
	formData: IssuingSubchainFormData = (() => {
		const self = this
		return {
			name: "",
			abbreviation: "",

			logo: "",
			banner: "",

			forgeInterval: 128,
			miniFee: "",

			genesisNodeAddress: "",
			// searchPort: number;
			magic: "",
			offset: 1,

			get port() {
				return self.formData_port
			},
			get rewardPerBlock() {
				return self.formData_rewardPerBlock
			},
			genesisSecret: "",
			get delegatesSecret() {
				return self.formData_delegatesSecret
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
	/// 
	@SubchainIssuingSubchainPage.setErrorTo("errors", "name", ["WRONG_RANGE"])
	check_name() {
		const res: any = {};
		const { name } = this.formData;
		if (name.length > 36) {
			res.WRONG_RANGE = "NAME_TOO_LONG";
		}
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "abbreviation", ["WRONG_RANGE", "WRONG_CHAR"])
	check_abbreviation() {
		const res: any = {};
		const { abbreviation } = this.formData;
		if (abbreviation.length > 5) {
			res.WRONG_RANGE = "ABBREVIATION_TOO_LONG";
		} else if (abbreviation.length < 2) {
			res.WRONG_RANGE = "ABBREVIATION_TOO_SHORT";
		}
		for (var i = 0; i < abbreviation.length; i += 1) {
			if (!/[a-zA-Z]/.test(abbreviation[i])) {
				res.WRONG_CHAR = "ABBREVIATION_WRONG_CHAR";
				break;
			}
		}
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "forgeInterval", ["WRONG_NUMBER", "WRONG_RANGE"])
	check_forgeInterval() {
		const res: any = {};
		const { forgeInterval } = this.formData;
		if (!Number.isFinite(forgeInterval)) {
			res.WRONG_NUMBER = "FORGEINTERVAL_SHOULD_BE_AN_NUMBER"
		} else {
			if (forgeInterval <= 0) {
				res.WRONG_RANGE = "FORGEINTERVAL_TOO_SMALL"
			} else if (forgeInterval > 1e3 * 60 * 60 * 24) {
				res.WRONG_RANGE = "FORGEINTERVAL_TOO_LARGE"
			}
		}
		return res;
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "miniFee", ["WRONG_NUMBER", "WRONG_RANGE"])
	check_miniFee() {
		const res: any = {};
		const { miniFee } = this.formData;
		const miniFee_num = +(miniFee);
		if (!Number.isFinite(miniFee_num)) {
			res.WRONG_NUMBER = "MINIFEE_SHOULD_BE_AN_NUMBER"
		} else {
			if (miniFee_num < 0.00000001) {
				res.WRONG_RANGE = "MINIFEE_TOO_SMALL"
			} else if (miniFee_num > 1e3) {
				res.WRONG_RANGE = "MINIFEE_TOO_LARGE"
			}
		}
		return res
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "genesisNodeAddress", ["WRONG_NUMBER", "WRONG_RANGE"])
	check_genesisNodeAddress() {
		const res: any = {};
		const { genesisNodeAddress } = this.formData;
		if (!this.transactionService.isAddressCorrect(genesisNodeAddress)) {
			res.WRONG_ADDRESS = "GENESIS_NODE_ADDRESS_IS_MALFORMED";
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
		return this._port_checker(this.formData.searchPort, "SEARCH_PORT_IN_WRONG_RANGE")
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "port.web", ["WRONG_PORT_RANGE"])
	check_port_web() {
		return this._port_checker(this.formData_port.web, "WEB_PORT_IN_WRONG_RANGE")
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "port.p2p", ["WRONG_PORT_RANGE"])
	check_port_p2p() {
		return this._port_checker(this.formData_port.p2p, "P2P_PORT_IN_WRONG_RANGE")
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "port.p2pForTrs", ["WRONG_PORT_RANGE"])
	check_port_p2pForTrs() {
		return this._port_checker(this.formData_port.p2pForTrs, "P2PFORTRS_PORT_IN_WRONG_RANGE")
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
	@SubchainIssuingSubchainPage.setErrorTo("errors", "offset", ["ITEM_WRONG_RANGE"])
	check_rewardPerBlock() {
		const res: any = {};
		const { rewardPerBlock } = this.formData;
		// TODO: check rewardPerBlock
		if (rewardPerBlock.some(info => {
			return (info.height < 0 || parseFloat(info.reward) < 0);
		})) {
			res.ITEM_WRONG_RANGE = "REWARDPERBLOCK_SOME_ITEM_IS_IN_WRONG_RANGE";
		}
		return res;
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "genesisSecret", ["WRONG_RANGE"])
	check_genesisSecret() {
		const res: any = {};
		const { genesisSecret } = this.formData;
		if (genesisSecret.length > 256) {
			res.WRONG_RANGE = "GENESISSECRET_TOO_LONG"
		}
		return res;
	}
	@SubchainIssuingSubchainPage.setErrorTo("errors", "delegatesSecret", ["ITEM_WRONG_RANGE"])
	check_delegatesSecret() {
		const res: any = {};
		const { delegatesSecret } = this.formData;
		if (delegatesSecret.some(secret => {
			return secret.length > 256;
		})) {
			res.ITEM_WRONG_RANGE = "DELEGATESSECRET_SOME_ITEM_IS_TOO_LONG";
		}
		return res;
	}
	/**校验支付密码*/
	@SubchainIssuingSubchainPage.setErrorTo("errors", "pay_pwd", [
		"VerificationFailure",
		"NeedInput",
	])
	check_pay_pwd() {
		if (this.formData.pay_pwd) {
			if (
				!this.transactionService.verifySecondPassphrase(this.formData.pay_pwd)
			) {
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

	/**切换同意用户协议*/
	toggleAgreement() {
		this.formData.agree_user_aggreement = !this.formData.agree_user_aggreement;
	}

	pickSubchainLogo() {
		const inputEle = fileInputEleFactory("pickSubchainLogoPicker");
		inputEle.value = "";
		const clickEvent = new MouseEvent("click", {
			view: window,
			bubbles: true,
			cancelable: true,
		});
		inputEle.onchange = e => {
			if (inputEle.files && inputEle.files[0]) {
				this.formData.logo = URL.createObjectURL(inputEle.files[0]);
			} else {
				console.log("没有选择文件，代码不应该运行到这里");
			}
		}
		inputEle.dispatchEvent(clickEvent);
	}
	pickSubchainBanner(){
		const inputEle = fileInputEleFactory("pickSubchainBannerPicker");
		inputEle.value = "";
		const clickEvent = new MouseEvent("click", {
			view: window,
			bubbles: true,
			cancelable: true,
		});
		inputEle.onchange = e => {
			if (inputEle.files && inputEle.files[0]) {
				this.formData.banner = URL.createObjectURL(inputEle.files[0]);
			} else {
				console.log("没有选择文件，代码不应该运行到这里");
			}
		}
		inputEle.dispatchEvent(clickEvent);
	}


	get canSubmit() {
		const canSubmit = super.canSubmit;
		if (canSubmit) {
			if (this.formData.need_pay_pwd) {
				return !!this.formData.pay_pwd;
			}
		}
		return canSubmit;
	}
	private _cache_base64_map = new Map<string, { url: string, base64: Promise<string> }>();
	getCacheBase64(type: "logo" | "banner", url: string) {
		let cache = this._cache_base64_map.get(type);
		if (!cache || cache.url !== url) {
			cache = {
				url,
				base64: this.subchainService.imageUrlToJpegBase64(url, true)
			}
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
		await this.subchainService.addSubchain({
			name: formData.name,
			abbreviation: formData.abbreviation,
			logo: await this.getCacheBase64("logo", formData.logo),
			banner: await this.getCacheBase64("banner", formData.banner),
			forgeInterval: formData.forgeInterval,
			miniFee: formData.miniFee,
			genesisNodeAddress: formData.genesisNodeAddress,
			searchPort: formData.searchPort,
			magic: formData.magic,
			offset: formData.offset,
			port: formData.port,
			rewardPerBlock: formData.rewardPerBlock,
		}, formData.fee, formData.pwd, formData.pay_pwd);
		this.finishJob();
	}
}
