import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { SettingsSetPayPwdPage } from "./settings-set-pay-pwd";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material";

@NgModule({
  declarations: [SettingsSetPayPwdPage],
  imports: [
    IonicPageModule.forChild(SettingsSetPayPwdPage),
    ComponentsModule,
    DirectivesModule,
    TranslateModule,
    MatButtonModule,
  ],
})
export class SettingsSetPayPwdPageModule {}
