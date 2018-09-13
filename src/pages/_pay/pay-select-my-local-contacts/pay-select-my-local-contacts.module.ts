import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { PaySelectMyLocalContactsPage } from "./pay-select-my-local-contacts";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [PaySelectMyLocalContactsPage],
  imports: [
    IonicPageModule.forChild(PaySelectMyLocalContactsPage),
    ComponentsModule,
    PipesModule,
    TranslateModule,
  ],
})
export class PaySelectMyLocalContactsPageModule {}
