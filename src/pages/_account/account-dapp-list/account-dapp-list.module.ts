import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountDappListPage } from "./account-dapp-list";

@NgModule({
  declarations: [AccountDappListPage],
  imports: [IonicPageModule.forChild(AccountDappListPage)],
})
export class AccountDappListPageModule {}
