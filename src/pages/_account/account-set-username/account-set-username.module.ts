import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountSetUsernamePage } from "./account-set-username";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [AccountSetUsernamePage],
  imports: [
    IonicPageModule.forChild(AccountSetUsernamePage),
    ComponentsModule,
    DirectivesModule,
    TranslateModule,
  ],
})
export class AccountSetUsernamePageModule {}
