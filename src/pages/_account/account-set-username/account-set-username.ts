import { Component, Optional } from "@angular/core";
import { SecondLevelPage } from "../../../bnqkl-framework/SecondLevelPage";
import { asyncCtrlGenerator } from "../../../bnqkl-framework/Decorator";
import { TabsPage } from "../../tabs/tabs";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { AccountServiceProvider } from "../../../providers/account-service/account-service";

@IonicPage({ name: "account-set-username" })
@Component({
	selector: "page-account-set-username",
	templateUrl: "account-set-username.html",
})
export class AccountSetUsernamePage extends SecondLevelPage {
	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		@Optional() public tabs: TabsPage,
		public accountService: AccountServiceProvider,
	) {
		super(navCtrl, navParams, true, tabs);
	}
	formData = {
		username: "",
	};
	@AccountSetUsernamePage.setErrorTo("errors", "username", [
		// "tooShort",
		"tooLong",
		"haveSpaces",
	])
	check_username() {
		const res: any = {};
		if (/\s/.test(this.formData.username)) {
			res.haveSpaces = true;
		}
		if (this.formData.username.length > 20) {
			res.tooLong = true;
		}
		return res;
	}

	@asyncCtrlGenerator.error()
	async submit() {
		const { password } = await this.getUserPassword();
		await this._submit(password);
		this.finishJob();
	}

	@asyncCtrlGenerator.error(() =>
		AccountSetUsernamePage.getTranslate("SET_USERNAME_SUBMIT_ERROR"),
	)
	@asyncCtrlGenerator.loading(() =>
		AccountSetUsernamePage.getTranslate("SET_USERNAME_SUBMITING"),
	)
	@asyncCtrlGenerator.success(() =>
		AccountSetUsernamePage.getTranslate("SET_USERNAME_SUBMIT_SUCCESS"),
	)
	async _submit(password: string) {
		return this.accountService.changeUsername(
			this.formData.username,
			password,
		);
	}
}
