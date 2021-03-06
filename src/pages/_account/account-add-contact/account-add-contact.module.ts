import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { AccountAddContactPage } from "./account-add-contact";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [AccountAddContactPage],
  imports: [
    IonicPageModule.forChild(AccountAddContactPage),
    ComponentsModule,
    DirectivesModule,
    TranslateModule,
  ],
})
export class AccountAddContactPageModule {}
