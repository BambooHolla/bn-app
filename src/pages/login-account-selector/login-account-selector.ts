import { Component, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular/index";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { BlizzardHash } from "../../bnqkl-framework/lib/BlizzardHash";
import { UserTokenModel } from "../../providers/app-setting/app-setting.type";
import { LoginServiceProvider } from "../../providers/login-service/login-service";
import { MainPage } from "../pages";

@IonicPage({ name: "login-account-selector" })
@Component({
  selector: "page-login-account-selector",
  templateUrl: "login-account-selector.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginAccountSelectorPage extends FirstLevelPage {
  constructor(public navCtrl: NavController, public navParams: NavParams, public cdRef: ChangeDetectorRef, public loginService: LoginServiceProvider) {
    super(navCtrl, navParams);
  }
  @ViewChild("accountListWrapper") accountListWrapperRef?: ElementRef;

  @LoginAccountSelectorPage.markForCheck selected_account?: UserTokenModel;
  @LoginAccountSelectorPage.markForCheck login_able_accounts: UserTokenModel[] = [];
  get selectable_accounts() {
    return this.login_able_accounts.filter(acc => acc !== this.selected_account);
  }

  @LoginAccountSelectorPage.markForCheck logined_account?: UserTokenModel;
  @LoginAccountSelectorPage.willEnter
  getCurrentLoginAccount() {
    this.logined_account = this.appSetting.getUserToken() || undefined;
  }
  isLoginedAccount(account: UserTokenModel) {
    if (this.logined_account) {
      return this.logined_account.address == account.address;
    }
  }

  @LoginAccountSelectorPage.willEnter
  @asyncCtrlGenerator.loading()
  async getLoginAbleAccounts() {
    const accountMap = await this.appSetting.getLoginAbleAccounts();
    this.login_able_accounts = [...accountMap.values()].sort((a, b) => b.lastest_login_time - a.lastest_login_time);
    await this.refreshAccountsBalance();
    this.selected_account = this.login_able_accounts[0];
    this.generateStyleList();
  }
  /**选中要登录的联系人*/
  selectAccount(account: UserTokenModel) {
    this.selected_account = account;
    this.generateStyleList();
  }

  /**刷新账户余额*/
  @LoginAccountSelectorPage.addEvent("HEIGHT:CHANGED")
  @asyncCtrlGenerator.error()
  async refreshAccountsBalance() {
    await Promise.all(
      this.login_able_accounts.map(async account => {
        Object.assign(account, { balance: "0" /*找不到账户的情况下，将余额滞空*/ }, await this.accountService.getAccountByAddress(account.address));
      })
    );

    this.appSetting.addLoginAbleAccountList(this.login_able_accounts);
  }

  private _selected_style = {
    top: 0,
    bottom: "unset",
    backgroundColor: "#000",
    background: "",
    zIndex: 100,
    transform: "scale(0.98)",
  };
  @LoginAccountSelectorPage.markForCheck style_list: any[] = [];
  generateStyleList() {
    const { selected_account, login_able_accounts } = this;
    const num = login_able_accounts.length - 1;
    if (num <= 0) {
      return;
    }
    if (selected_account) {
      // this._selected_style.backgroundColor = this.addressToColor(selected_account.address);
      this._selected_style.background = `linear-gradient(to bottom, ${this.addressToColor(selected_account.address, 1)} 0%, ${this.addressToColor(
        selected_account.address,
        0.8
      )} 100%)`;
    }
    if (this.accountListWrapperRef && "top" in this._selected_style) {
      const ele = this.accountListWrapperRef.nativeElement as HTMLElement;
      const heightVW = (ele.clientHeight / document.body.clientWidth) * 100;
      delete this._selected_style.top;
      this._selected_style.bottom = `${heightVW - 50}vw`;
    }
    const unit_top_rate = Math.min(40 / num, 40 / 5);
    const min_rotateX = 2;
    const max_rotateX = 4;
    const min_scale = 0.94;
    const max_scale = 0.96;
    let i = 0;
    this.style_list = login_able_accounts.map((account, _index) => {
      if (account === selected_account) {
        this._selected_style.zIndex = _index;
        return this._selected_style;
      }
      const ri = num - i;
      const buttonRate = (ri * unit_top_rate).toFixed(4);
      const rotateX = ((max_rotateX - min_rotateX) * i) / num + min_rotateX;
      const scale = ((max_scale - min_scale) * i) / num + min_scale;
      const backgroundColor = this.addressToColor(account.address);
      const style = {
        background: `linear-gradient(to bottom, ${this.addressToColor(account.address, 1)} 0%, ${this.addressToColor(account.address, 0.8)} 100%)`,
        backgroundColor: "#000",
        // "--from-color": backgroundColor,
        // "--to-color": this.addressToColor(account.address, 0.8),
        bottom: `-webkit-calc(-20vw + ${buttonRate}%)`,
        zIndex: _index,
        transform: `rotateX(-${rotateX}deg) scale(${scale})`,
      };
      i += 1;
      return style;
    });
  }
  private _color_base = ["ff0000", "ff8000", "ffff00", "80ff00", "00ff00", "00ff80", "00ffff", "0080ff", "0000ff", "7f00ff", "ff00ff", "ff007f", "808080"];
  private _cache_address_color = new Map<string, [number, number, number]>();
  addressToColor(address: string, opacity = 1) {
    let color = this._cache_address_color.get(address);
    if (!color) {
      const rate = 0.8;
      const color_rest = 255 * (1 - rate);
      const { _color_base } = this;
      const random_base_color = BlizzardHash.hashToRandom(address, 0, 0, _color_base.length * 10, true);
      const base_color_str = _color_base[random_base_color % _color_base.length];
      const r_base = Math.floor(parseInt(base_color_str.substr(0, 2), 16) * rate);
      const g_base = Math.floor(parseInt(base_color_str.substr(2, 2), 16) * rate);
      const b_base = Math.floor(parseInt(base_color_str.substr(4, 2), 16) * rate);
      const r_num = BlizzardHash.hashToRandom(address, r_base, 0, color_rest, true);
      const g_num = BlizzardHash.hashToRandom(address, g_base, 0, color_rest, true);
      const b_num = BlizzardHash.hashToRandom(address, b_base, 0, color_rest, true);
      color = [r_base + r_num, g_base + g_num, b_base + b_num];

      this._cache_address_color.set(address, color);
    }
    return `rgba(${color},${opacity})`;
  }

  @LoginAccountSelectorPage.detectChanges is_delete_mode = false;
  toggleToDeleteAccounts(is_delete_mode = !this.is_delete_mode) {
    this.is_delete_mode = is_delete_mode;
  }

  @asyncCtrlGenerator.error()
  async addAccount() {
    if (this.login_able_accounts.length >= 10) {
      if (await this.waitTipDialogConfirm("@@TOO_MANY_ACCOUNT_WILL_BE_REMOVE_AUTOMATICALLY")) {
        this.appSetting.delLoginAbleAccount(this.login_able_accounts[this.login_able_accounts.length - 1].address);
      } else {
        this.toggleToDeleteAccounts(true);
      }
    }
    return this.smartRouteTo("sign-in-and-sign-up");
  }

  /**移除账户*/
  @asyncCtrlGenerator.error()
  async removeAccount(account: UserTokenModel) {
    this.showConfirmDialog(await this.getTranslate("CONFIRM_TO_REMOVE_THIS_ACCOUNT_#ADDRESS#", account), () => {
      this._removeAccount(account);
    });
  }
  @asyncCtrlGenerator.error()
  private async _removeAccount(account: UserTokenModel) {
    await this.appSetting.delLoginAbleAccount(account.address);
    const accountMap = await this.appSetting.getLoginAbleAccounts();
    this.login_able_accounts.splice(this.login_able_accounts.indexOf(account), 1);
    if (account === this.selected_account) {
      this.selected_account = this.login_able_accounts[0];
    }
    this.generateStyleList();
    this.markForCheck();
  }

  /**执行登陆*/
  @asyncCtrlGenerator.error("@@LOGIN_ERROR")
  async doLogin(account: UserTokenModel) {
    const result = await this.loginService.doLogin(account.password, account.remember);
    if (result) {
      // this.routeTo("scan-nodes");
      await this.myapp.openPage(MainPage, true, null /*"@@LOGINNG"*/);
    }
  }
}
