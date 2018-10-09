import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { DappBillPage } from "./dapp-bill";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [DappBillPage],
  imports: [IonicPageModule.forChild(DappBillPage), TranslateModule],
})
export class DappBillPageModule {}
