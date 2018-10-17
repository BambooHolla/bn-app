import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { AccountExportMyLocalContactsPage } from "./account-export-my-local-contacts";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import { DirectivesModule } from "../../../directives/directives.module";

@NgModule({
  declarations: [AccountExportMyLocalContactsPage],
  imports: [
    IonicPageModule.forChild(AccountExportMyLocalContactsPage),
    ComponentsModule,
    PipesModule,
    TranslateModule,
    DirectivesModule
  ],
})
export class AccountExportMyLocalContactsPageModule {}
