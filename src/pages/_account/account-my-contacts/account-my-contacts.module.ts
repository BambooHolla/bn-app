import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountMyContactsPage } from "./account-my-contacts";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";

@NgModule({
  declarations: [AccountMyContactsPage],
  imports: [
    IonicPageModule.forChild(AccountMyContactsPage),
    ComponentsModule,
    PipesModule,
  ],
})
export class AccountMyContactsPageModule {}
