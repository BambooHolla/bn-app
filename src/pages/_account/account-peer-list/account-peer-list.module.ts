import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountPeerListPage } from "./account-peer-list";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [AccountPeerListPage],
  imports: [IonicPageModule.forChild(AccountPeerListPage), TranslateModule],
})
export class AccountPeerListPageModule {}
