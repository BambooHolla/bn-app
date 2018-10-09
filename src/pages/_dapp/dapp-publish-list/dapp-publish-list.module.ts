import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { DappPublishListPage } from "./dapp-publish-list";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [DappPublishListPage],
  imports: [IonicPageModule.forChild(DappPublishListPage), TranslateModule],
})
export class DappPublishListPageModule {}
