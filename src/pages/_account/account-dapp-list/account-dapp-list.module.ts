import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { AccountDappListPage } from "./account-dapp-list";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [AccountDappListPage],
  imports: [IonicPageModule.forChild(AccountDappListPage), TranslateModule],
})
export class AccountDappListPageModule {}
