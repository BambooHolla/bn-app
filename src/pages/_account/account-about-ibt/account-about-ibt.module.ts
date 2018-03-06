import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountAboutIbtPage } from "./account-about-ibt";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [AccountAboutIbtPage],
  imports: [
    IonicPageModule.forChild(AccountAboutIbtPage),
    TranslateModule,
    DirectivesModule,
    ComponentsModule,
  ],
})
export class AccountAboutIbtPageModule {}
