import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountInfoPage } from "./account-info";
import { ComponentsModule } from "../../../components/components.module";

@NgModule({
  declarations: [AccountInfoPage],
  imports: [IonicPageModule.forChild(AccountInfoPage), ComponentsModule],
})
export class AccountInfoPageModule {}
