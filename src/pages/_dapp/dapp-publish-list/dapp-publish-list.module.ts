import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { DappPublishListPage } from "./dapp-publish-list";

@NgModule({
  declarations: [DappPublishListPage],
  imports: [IonicPageModule.forChild(DappPublishListPage)],
})
export class DappPublishListPageModule {}
