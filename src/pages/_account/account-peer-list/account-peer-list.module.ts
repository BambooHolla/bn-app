import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountPeerListPage } from "./account-peer-list";

@NgModule({
  declarations: [AccountPeerListPage],
  imports: [IonicPageModule.forChild(AccountPeerListPage)],
})
export class AccountPeerListPageModule {}
