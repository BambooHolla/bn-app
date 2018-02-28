import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountNewsDetailPage } from "./account-news-detail";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
	declarations: [AccountNewsDetailPage],
	imports: [IonicPageModule.forChild(AccountNewsDetailPage), TranslateModule],
})
export class AccountNewsDetailPageModule {}
