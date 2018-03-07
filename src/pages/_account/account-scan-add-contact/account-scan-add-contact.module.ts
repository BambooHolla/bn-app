import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountScanAddContactPage } from "./account-scan-add-contact";
import { TranslateModule } from "@ngx-translate/core";
import { ComponentsModule } from "../../../components/components.module";

@NgModule({
  declarations: [AccountScanAddContactPage],
  imports: [
    IonicPageModule.forChild(AccountScanAddContactPage),
    TranslateModule,
    ComponentsModule,
  ],
})
export class AccountScanAddContactPageModule {}
