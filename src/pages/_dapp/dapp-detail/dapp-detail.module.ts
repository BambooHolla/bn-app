import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { DappDetailPage } from "./dapp-detail";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
	declarations: [DappDetailPage],
	imports: [IonicPageModule.forChild(DappDetailPage), TranslateModule],
})
export class DappDetailPageModule {}
