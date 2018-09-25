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

	port: {
		web: number;
		p2p: number;
		p2pForTrs: number;
	};
	rewardPerBlock: {
		height: number;
		reward: number;
	}[];

	genesisSecret: string;
	delegatesSecret: string[];

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
		public domSanitizer: DomSanitizer
	) {
		super(navCtrl, navParams, true, tabs);
	}

	// TODO: @SubchainIssuingSubchainPage.propMarkForCheck([])
	// TODO: @SubchainIssuingSubchainPage.propDetectChanges([])
	formData: IssuingSubchainFormData = {
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

		port: {
			// web: number;
			// p2p: number;
			// p2pForTrs: number;
		} as any,
		rewardPerBlock: [],
		genesisSecret: "",
		delegatesSecret: [],

		/// 交易所需基本信息
		pwd: "",
		need_pay_pwd: this.userInfo.hasSecondPwd,
		pay_pwd: "",
		fee: parseFloat(this.appSetting.settings.default_fee),

		/// 其它页面上需要的一些数据
		agree_user_aggreement: false,
	} as any;
	ignore_keys = ["logo", "banner", "pay_pwd", "rewardPerBlock"];

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
}
