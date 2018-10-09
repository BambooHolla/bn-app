import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { AccountInfoPage } from "./account-info";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [AccountInfoPage],
  imports: [
    IonicPageModule.forChild(AccountInfoPage),
    ComponentsModule,
    DirectivesModule,
    TranslateModule,
  ],
})
export class AccountInfoPageModule {}
