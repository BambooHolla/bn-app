import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { AccountRemarkContactTagsPage } from "./account-remark-contact-tags";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [AccountRemarkContactTagsPage],
  imports: [
    IonicPageModule.forChild(AccountRemarkContactTagsPage),
    ComponentsModule,
    PipesModule,
    DirectivesModule,
    TranslateModule,
  ],
})
export class AccountRemarkContactTagsPageModule {}
