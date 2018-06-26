import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountContactDetailPage } from "./account-contact-detail";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [AccountContactDetailPage],
  imports: [
    IonicPageModule.forChild(AccountContactDetailPage),
    ComponentsModule,
    PipesModule,
    TranslateModule,
  ],
})
export class AccountContactDetailPageModule {}
