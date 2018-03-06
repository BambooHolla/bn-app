import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountAddContactPage } from "./account-add-contact";
import { ComponentsModule } from "../../../components/components.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [AccountAddContactPage],
  imports: [
    IonicPageModule.forChild(AccountAddContactPage),
    ComponentsModule,
    TranslateModule,
  ],
})
export class AccountAddContactPageModule {}
