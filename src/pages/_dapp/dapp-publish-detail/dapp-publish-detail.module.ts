import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { DappPublishDetailPage } from "./dapp-publish-detail";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [DappPublishDetailPage],
  imports: [IonicPageModule.forChild(DappPublishDetailPage), TranslateModule],
})
export class DappPublishDetailPageModule {}
