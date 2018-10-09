import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { AccountAddLocalContactPage } from "./account-add-local-contact";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [AccountAddLocalContactPage],
  imports: [
    IonicPageModule.forChild(AccountAddLocalContactPage),
    ComponentsModule,
    DirectivesModule,
    TranslateModule,
  ],
})
export class AccountAddLocalContactPageModule {}
