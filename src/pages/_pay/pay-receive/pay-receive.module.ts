import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { PayReceivePage } from "./pay-receive";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { MomentModule } from "angular2-moment";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [PayReceivePage],
  imports: [
    IonicPageModule.forChild(PayReceivePage),
    ComponentsModule,
    DirectivesModule,
    PipesModule,
    MomentModule,
    TranslateModule,
  ],
})
export class PayReceivePageModule {}
